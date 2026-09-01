const { Post, Comment } = require('../models/postsModel');
const gitService = require('../utils/gitService');
const { decrypt } = require('../utils/encryption');

const DEFAULT_PROFILE_PIC = '/elements/media/profile-pictures/Default_pfp.jpg';

// Helper function to delete all comments associated with a post
async function deletePostComments(commentIds) {
    if (commentIds && commentIds.length > 0) {
        await Comment.deleteMany({ _id: { $in: commentIds } });
    }
}

// Helper function to normalize authors array, ensuring each author has a username and profilePic
function normalizePostAuthors(authors) {
    return (authors || []).map(author => {
        if (!author) {
            return {
                username: 'Unknown',
                profilePic: DEFAULT_PROFILE_PIC
            };
        }

        const normalizedAuthor = { ...author };

        if (!normalizedAuthor.username || normalizedAuthor.username.trim() === '') {
            normalizedAuthor.username = 'Unknown';
        }

        if (!normalizedAuthor.profilePic || normalizedAuthor.profilePic.trim() === '') {
            normalizedAuthor.profilePic = DEFAULT_PROFILE_PIC;
        }

        return normalizedAuthor;
    });
}

// Helper function to check if a user can manage (edit/delete) a post
function canManagePost(post, userId) {
    if (!post || !userId) return false;

    // Check if the user is one of the authors
    const isAuthor = Array.isArray(post.authors) && post.authors.some(authorId => authorId.toString() === userId);

    // Check if the user is the group admin
    const isGroupAdmin = post.groupAdminId && post.groupAdminId.toString() === userId;

    return isAuthor || isGroupAdmin;
}

class PostController {
    // Controller method to handle fetching all posts
    async getAllPosts(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        try {
            // Fetch all posts and deeply populate all user references
            const posts = await Post.find().sort({ _id: -1 })
                .populate('authors')
                .populate('likedByUsers')
                .populate('savedByUsers')
                .populate('group')
                .populate({
                    path: 'comments',
                    populate: { path: 'userId' } // Populate the user who wrote the comment
                });

            // Format posts to decrypt usernames before sending to frontend
            const formattedPosts = posts.map(post => {
                const postObj = post.toObject();

                postObj.authors = normalizePostAuthors(postObj.authors);

                // Decrypt authors
                if (postObj.authors) {
                    postObj.authors.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                }
                // Decrypt likedByUsers
                if (postObj.likedByUsers) {
                    postObj.likedByUsers.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                }
                // Decrypt savedByUsers
                if (postObj.savedByUsers) {
                    postObj.savedByUsers.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                }
                // Decrypt comments users
                if (postObj.comments) {
                    postObj.comments.forEach(c => {
                        if (c.userId && c.userId.username) c.userId.username = decrypt(c.userId.username);
                    });
                }

                postObj.stats.comments = postObj.comments?.length || 0;

                return postObj;
            });

            res.status(200).json(formattedPosts);
        } catch (error) {
            res.status(500).json({ message: "Error fetching posts from database", error });
        }
    }

    // Controller method to handle creating a new post in the database
    async createPost(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const newPostData = req.body;
            newPostData.authors = [req.session.userId];

            if (newPostData.groupId) {
                newPostData.group = newPostData.groupId;
            }

            if (!newPostData.groupAdminId) {
                newPostData.groupAdminId = null;
            }

            if (newPostData.mediaSource && newPostData.mediaSource.startsWith('data:')) {
                const extension = newPostData.mediaType === 'video' ? 'mp4' : 'jpg';
                const filename = `post_${Date.now()}.${extension}`;
                // Keep the original Base64 data for the background task
                const base64Data = newPostData.mediaSource;
                const dbMediaPath = `elements/media/posts/main-posts/${filename}`;
                newPostData.mediaSource = dbMediaPath;
                // The full relative path to be passed to the Git Service
                const fullRelativePath = `../views/${dbMediaPath}`;
                gitService.saveMediaAndPushToGit(base64Data, fullRelativePath);
            }

            const newPost = new Post(newPostData);
            const createdPost = await newPost.save();
            const baseUrl = `${req.protocol}://${req.get('host')}`;

            // Add the post to the group or user's personal posts
            if (newPostData.group) {
                try {
                    await fetch(`${baseUrl}/api/groups/addPost`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
                        body: JSON.stringify({ postId: createdPost._id, groupId: newPostData.group })
                    });
                } catch (err) { console.error("Error calling groups route:", err); }
            } else {
                try {
                    await fetch(`${baseUrl}/api/user/addPersonalPost`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
                        body: JSON.stringify({ postId: createdPost._id })
                    });
                } catch (err) { console.error("Error calling user route:", err); }
            }
            res.status(201).json(createdPost);
        } catch (error) {
            res.status(500).json({ message: "Error creating post in database", error });
        }
    }

    // Controller method to handle deleting a post
    async deletePost(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const postId = req.params.id;
            const userId = req.session.userId;

            // Get the post to check if it exists and if the user is authorized to delete it
            const postToDelete = await Post.findById(postId);
            
            if (!postToDelete) {
                return res.status(404).json({ message: "Post not found" });
            }

            if (!canManagePost(postToDelete, userId)) {
                return res.status(403).json({ message: "You don't have permission to delete this post" });
            }

            // After passing the authorization check, use Mongoose's built-in findByIdAndDelete with the MongoDB _id
            const deletedPost = await Post.findByIdAndDelete(postId);

            if (deletedPost) {
                // If post has a media file (not a text post), trigger background deletion
                if (deletedPost.mediaType !== 'text' && deletedPost.mediaSource) {
                    // Create the full relative path to pass to the Git Service
                    const fullRelativePath = `../views/${deletedPost.mediaSource}`;
                    gitService.deleteMediaAndPushToGit(fullRelativePath);
                }

                const baseUrl = `${req.protocol}://${req.get('host')}`;
                // Remove the post from the group or user's personal posts
                if (deletedPost.group) {
                    try {
                        await fetch(`${baseUrl}/api/groups/removePost/${deletedPost.group}/${postId}`, {
                            method: 'DELETE',
                            headers: { 'Cookie': req.headers.cookie }
                        });
                    } catch (err) { console.error("Error calling groups route:", err); }
                } else {
                    try {
                        await fetch(`${baseUrl}/api/user/removePersonalPost/${postId}`, {
                            method: 'DELETE',
                            headers: { 'Cookie': req.headers.cookie }
                        });
                    } catch (err) { console.error("Error calling user route:", err); }
                }
                // Delete all comments associated with the post
                await deletePostComments(deletedPost.comments);

                res.status(200).json({ message: "Post deleted successfully" });
            } else {
                res.status(404).json({ message: "Post not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Error deleting post from database", error });
        }
    }

    // Method to delete multiple posts based on an array of IDs
    async deleteMultiplePosts(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { postIds } = req.body;

            // Validate that postIds array exists and is not empty
            if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
                return res.status(400).json({ success: false, message: "No post IDs provided" });
            }
            
            // Find all posts by their IDs using the $in operator for maximum efficiency
            const postsToDelete = await Post.find({ _id: { $in: postIds } });
            
            for (const post of postsToDelete) {
                // Trigger background deletion for media files if they exist
                if (post.mediaType !== 'text' && post.mediaSource) {
                    const fullRelativePath = `../views/${post.mediaSource}`;
                    gitService.deleteMediaAndPushToGit(fullRelativePath);
                }
                
                // Delete all comments associated with the post
                await deletePostComments(post.comments);
                
                // Delete the post document from the database
                await Post.findByIdAndDelete(post._id);
            }
            
            res.status(200).json({ success: true, message: "All required posts were deleted successfully" });
        } catch (error) {
            console.error("Error deleting posts:", error);
            res.status(500).json({ message: "Error deleting posts from database", error });
        }
    }

    async addComment(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const userId = req.session.userId;
            const { text } = req.body;
            const postId = req.params.id;

            if (!userId) return res.status(401).json({ message: "User not logged in" });

            const newComment = await Comment.create({ postId, userId, text });
            const updatedPost = await Post.findByIdAndUpdate(postId, {
                $push: { comments: newComment._id },
                $inc: { 'stats.comments': 1 }
            }, { returnDocument: 'after' });

            res.status(201).json({ comment: newComment, commentsCount: updatedPost.comments.length });
        } catch (error) {
            res.status(500).json({ message: "Error adding comment", error });
        }
    }

    // Handle liking/unliking a specific comment in a specific post
    async manageCommentLike(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const userId = req.session.userId || req.body.userId; // Use userId
            const commentId = req.params.id;

            if (!userId) {
                return res.status(401).json({ message: "User not logged in" });
            }

            const comment = await Comment.findById(commentId);
            if (!comment) {
                return res.status(404).json({ message: "Comment not found" });
            }

            // Check if user already liked the comment using ObjectId
            if (comment.likedBy.includes(userId)) {
                comment.likedBy.pull(userId);
                comment.likes = Math.max(0, comment.likes - 1);
            } else {
                comment.likedBy.push(userId);
                comment.likes += 1;
            }

            await comment.save();
            res.status(200).json(comment);
        } catch (error) {
            res.status(500).json({ message: "Error updating comment like", error });
        }
    }

    // Handle liking/unliking a post
    async managelikesPost(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const userId = req.session.userId || req.body.userId; // Use userId
            const postId = req.params.id;
            
            if (!userId) return res.status(401).json({ message: "User not logged in" });

            const post = await Post.findById(postId);

            // Check if user already liked the post using ObjectId
            if (post.likedByUsers.includes(userId)) {
                post.likedByUsers.pull(userId);
                post.stats.likes = Math.max(0, post.stats.likes - 1);
            } else {
                post.likedByUsers.push(userId);
                post.stats.likes += 1;
            }
            await post.save();
            res.status(200).json(post);
        } catch (error) {
            res.status(500).json({ message: "Error updating like", error });
        }
    }

    // Handle saving/unsaving a post
    async manageSavePost(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        try {
            const userId = req.session.userId || req.body.userId; // Use userId
            const postId = req.params.id;
            
            if (!userId) return res.status(401).json({ message: "User not logged in" });

            const post = await Post.findById(postId);

            if (post.savedByUsers.includes(userId)) {
                post.savedByUsers.pull(userId);
            } else {
                post.savedByUsers.push(userId);
            }
            await post.save();
            res.status(200).json(post);
        } catch (error) {
            res.status(500).json({ message: "Error updating save", error });
        }
    }

    // Controller method to get feed posts by calling users and groups routes
    async getFeedPosts(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ message: "User not logged in" });

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const fetchOptions = {
                method: 'GET',
                headers: { 'Cookie': req.headers.cookie } // Forward session cookie
            };

            let userPostIds = [];
            let groupPostIds = [];

            // Fetch post IDs from users controller
            try {
                const userRes = await fetch(`${baseUrl}/api/user/getFollowingAndPersonalPosts`, fetchOptions);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.success && userData.postIds) {
                        userPostIds = userData.postIds;
                    }
                }
            } catch (err) {
                console.error("Error fetching user posts:", err);
            }

            // Fetch post IDs from groups controller
            try {
                const groupRes = await fetch(`${baseUrl}/api/groups/getMyGroupsPosts`, fetchOptions);
                if (groupRes.ok) {
                    const groupData = await groupRes.json();
                    if (groupData.success && groupData.postIds) {
                        groupPostIds = groupData.postIds;
                    }
                }
            } catch (err) {
                console.error("Error fetching group posts:", err);
            }

            // Combine arrays and ensure all IDs are unique using a Set
            const combinedIds = [...userPostIds, ...groupPostIds];
            const uniquePostIds = [...new Set(combinedIds)];

            // Fetch the full posts from the DB, populate, and sort by newest
            const feedPosts = await Post.find({ _id: { $in: uniquePostIds } })
                .sort({ createdAt: -1 })
                .populate('authors')
                .populate('likedByUsers')
                .populate('savedByUsers')
                .populate('group')
                .populate({
                    path: 'comments',
                    populate: { path: 'userId' } // Populate the user who wrote the comment
                });

            // Format posts to decrypt usernames before sending to frontend
            const formattedPosts = feedPosts.map(post => {
                const postObj = post.toObject();

                postObj.authors = normalizePostAuthors(postObj.authors);

                // Decrypt authors
                if (postObj.authors) {
                    postObj.authors.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                }
                // Decrypt likedByUsers
                if (postObj.likedByUsers) {
                    postObj.likedByUsers.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                }
                // Decrypt savedByUsers
                if (postObj.savedByUsers) {
                    postObj.savedByUsers.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                }
                // Decrypt comments users
                if (postObj.comments) {
                    postObj.comments.forEach(c => {
                        if (c.userId && c.userId.username) c.userId.username = decrypt(c.userId.username);
                    });
                }

                postObj.stats.comments = postObj.comments?.length || 0;

                return postObj;
            });

            res.status(200).json(formattedPosts);
        } catch (error) {
            console.error("Error fetching feed posts:", error);
            res.status(500).json({ message: "Error fetching feed posts from database", error });
        }
    }

    // Controller method to handle updating an existing post
    async updatePost(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const postId = req.params.id;
            const userId = req.session.userId;
            const { caption, location } = req.body;

            if (!userId) {
                return res.status(401).json({ message: "User not logged in" });
            }

            // Fetch the post to check if it exists and if the user is authorized to update it
            const postToUpdate = await Post.findById(postId);
            
            if (!postToUpdate) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Check if the user is authorized to update the post
            if (!canManagePost(postToUpdate, userId)) {
                return res.status(403).json({ message: "You don't have permission to update this post" });
            }

            // Create an object with the fields that need to be updated
            const updateFields = {};
            if (caption !== undefined) updateFields.caption = caption;
            if (location !== undefined) updateFields.location = location;

            // Perform the update in the database
            const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $set: updateFields },
                { returnDocument: 'after' } // Return the updated document
            );

            res.status(200).json({ message: "Post updated successfully", post: updatedPost });
        } catch (error) {
            console.error("Error updating post:", error);
            res.status(500).json({ message: "Error updating post in database", error });
        }
    }
    // Controller method to handle advanced post search with 3 parameters
    async advancedFeedSearch(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ message: "User not logged in" });

            const { searchText, mediaTypes, timeFilter } = req.body;
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const fetchOptions = {
                method: 'GET',
                headers: { 'Cookie': req.headers.cookie }
            };

            // Get only allowed post IDs (Same logic as getFeedPosts)
            let userPostIds = [];
            let groupPostIds = [];

            try {
                const userRes = await fetch(`${baseUrl}/api/user/getFollowingAndPersonalPosts`, fetchOptions);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.success && userData.postIds) userPostIds = userData.postIds;
                }
            } catch (err) { console.error("Error fetching user posts:", err); }

            try {
                const groupRes = await fetch(`${baseUrl}/api/groups/getMyGroupsPosts`, fetchOptions);
                if (groupRes.ok) {
                    const groupData = await groupRes.json();
                    if (groupData.success && groupData.postIds) groupPostIds = groupData.postIds;
                }
            } catch (err) { console.error("Error fetching group posts:", err); }

            const uniquePostIds = [...new Set([...userPostIds, ...groupPostIds])]; // Make a set without duplicate

            // Find matching encrypted usernames
            let matchedUserIds = [];
            if (searchText && searchText.trim() !== '') {
                const User = require('../models/usersModel'); 
                const allUsers = await User.find({});
                
                matchedUserIds = allUsers.filter(u => {
                    try {
                        // Decrypting and checking for a match
                        const decryptedName = u.decryptUsername().toLowerCase();
                        return decryptedName.includes(searchText.toLowerCase());
                    } catch {
                        return false;
                    }
                }).map(u => u._id);
            }

            // Build the Advanced MongoDB Query
            let query = { _id: { $in: uniquePostIds } }; // Search only in uniquePostIds

            // Text Search (Caption or Username)
            if (searchText && searchText.trim() !== '') {
                query.$or = [
                    { caption: { $regex: searchText, $options: 'i' } }, //search text that is a part of the full text and ignore uppercase
                    { authors: { $in: matchedUserIds } }
                ];
            }

            // Media Type Filter
            if (mediaTypes && mediaTypes.length > 0) {
                query.mediaType = { $in: mediaTypes };
            }

            // Time Filter
            if (timeFilter && timeFilter !== 'all') {
                const date = new Date();
                if (timeFilter === '24h') date.setHours(date.getHours() - 24);
                else if (timeFilter === 'week') date.setDate(date.getDate() - 7);
                query.createdAt = { $gte: date }; // graeter than or equal date
            }

            // Execute Query and Format
            const searchResults = await Post.find(query)
                .sort({ createdAt: -1 })
                .populate('authors')
                .populate('likedByUsers')
                .populate('savedByUsers')
                .populate('group')
                .populate({ path: 'comments', populate: { path: 'userId' } });

            // Decrypt usernames identically to getFeedPosts
            const formattedPosts = searchResults.map(post => {
                const postObj = post.toObject();
                postObj.authors = normalizePostAuthors(postObj.authors);

                if (postObj.authors) postObj.authors.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                if (postObj.likedByUsers) postObj.likedByUsers.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                if (postObj.savedByUsers) postObj.savedByUsers.forEach(u => { if (u && u.username) u.username = decrypt(u.username); });
                if (postObj.comments) {
                    postObj.comments.forEach(c => {
                        if (c.userId && c.userId.username) c.userId.username = decrypt(c.userId.username);
                    });
                }
                postObj.stats.comments = postObj.comments?.length || 0;
                return postObj;
            });

            res.status(200).json(formattedPosts);
        } catch (error) {
            console.error("Error executing advanced search:", error);
            res.status(500).json({ message: "Error searching posts", error });
        }
    }
    async deleteComment(req, res) {
        try {
            const userId = req.session.userId;
            const { postId, commentId } = req.params;

            if (!userId) return res.status(401).json({ message: "User not logged in" });

            const comment = await Comment.findById(commentId);
            if (!comment) return res.status(404).json({ message: "Comment not found" });

            const post = await Post.findById(postId);
            if (!post) return res.status(404).json({ message: "Post not found" });

            const isCommentAuthor = comment.userId.toString() === userId;
            const isPostAuthor = post.authors.some(author => author.toString() === userId);
            const isGroupAdmin = post.groupAdminId && post.groupAdminId.toString() === userId;

            if (!isCommentAuthor && !isPostAuthor && !isGroupAdmin) {
                return res.status(403).json({ message: "Unauthorized to delete this comment" });
            }

            await Comment.findByIdAndDelete(commentId);
            
            await Post.findByIdAndUpdate(postId, {
                $pull: { comments: commentId },
                $inc: { 'stats.comments': -1 }
            });

            res.status(200).json({ success: true, message: "Comment deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting comment", error });
        }
    }
}

module.exports = new PostController();