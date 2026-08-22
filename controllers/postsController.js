const { Post, Comment } = require('../models/postsModel');
const gitService = require('../utils/gitService');

class PostController {
    // Controller method to handle fetching all posts
    async getAllPosts(req, res) {
        try {
            // Fetch all posts and sort them by MongoDB's built-in _id (newest first)
            const posts = await Post.find().sort({ _id: -1 }).populate('comments');
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ message: "Error fetching posts from database", error });
        }
    }

    // Controller method to handle creating a new post in the database
    async createPost(req, res) {
        try {
            const newPostData = req.body;
            
            // Check if media needs to be saved
            if (newPostData.mediaSource && newPostData.mediaSource.startsWith('data:')) {
                const extension = newPostData.mediaType === 'video' ? 'mp4' : 'jpg';
                const filename = `post_${Date.now()}.${extension}`;
                
                // Keep the original Base64 data for the background task
                const base64Data = newPostData.mediaSource;
                
                // The path to be saved in the database (used by the frontend)
                const dbMediaPath = `elements/media/posts/main-posts/${filename}`;
                newPostData.mediaSource = dbMediaPath;
                
                // The full relative path to be passed to the Git Service
                const fullRelativePath = `../views/${dbMediaPath}`;
                
                // Send the save and Git operation to the background using the relative path
                gitService.saveMediaAndPushToGit(base64Data, fullRelativePath);
            }

            // Create and save to the database immediately
            const newPost = new Post(newPostData);
            const createdPost = await newPost.save();
            
            // Return response to client without waiting for files or Git
            res.status(201).json(createdPost);
        } catch (error) {
            res.status(500).json({ message: "Error creating post in database", error });
        }
    }

    // Controller method to handle deleting a post
    async deletePost(req, res) {
        try {
            const postId = req.params.id; 
            
            // Use Mongoose's built-in findByIdAndDelete with the MongoDB _id
            const deletedPost = await Post.findByIdAndDelete(postId);
            
            if (deletedPost) {
                // If post has a media file (not a text post), trigger background deletion
                if (deletedPost.mediaType !== 'text' && deletedPost.mediaSource) {
                    // Create the full relative path to pass to the Git Service
                    const fullRelativePath = `../views/${deletedPost.mediaSource}`;
                    gitService.deleteMediaAndPushToGit(fullRelativePath);
                }

                res.status(200).json({ message: "Post deleted successfully" });
            } else {
                res.status(404).json({ message: "Post not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Error deleting post from database", error });
        }
    }

    async addComment(req, res) {
        try {
            const username = req.session.username;
            const { text } = req.body;
            const postId = req.params.id;
            
            const newComment = await Comment.create({ postId, username, text });
            await Post.findByIdAndUpdate(postId, {
                $push: { comments: newComment._id },
                $inc: { 'stats.comments': 1 }
            });
            
            res.status(201).json(newComment);
        } catch (error) {
            res.status(500).json({ message: "Error adding comment", error });
        }
    }

    // Handle liking/unliking a specific comment in a specific post
    async manageCommentLike(req, res) {
        try {
            const username = req.session.username || req.body.username;
            const commentId = req.params.id;

            if (!username) {
                return res.status(401).json({ message: "User not logged in" });
            }

            const comment = await Comment.findById(commentId);
            if (!comment) {
                return res.status(404).json({ message: "Comment not found" });
            }

            // Check if user already liked the comment
            if (comment.likedBy.includes(username)) {
                comment.likedBy.pull(username);
                comment.likes = Math.max(0, comment.likes - 1);
            } else {
                comment.likedBy.push(username);
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
        try {
            const username = req.session.username;
            const postId = req.params.id;
            const post = await Post.findById(postId);
            
            if (post.likedByUsers.includes(username)) {
                post.likedByUsers.pull(username);
                post.stats.likes = Math.max(0, post.stats.likes - 1);
            } else {
                post.likedByUsers.push(username);
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
        try {
            const username = req.session.username;
            const postId = req.params.id;
            const post = await Post.findById(postId);
            
            if (post.savedByUsers.includes(username)) {
                post.savedByUsers.pull(username);
            } else {
                post.savedByUsers.push(username);
            }
            await post.save();
            res.status(200).json(post);
        } catch (error) {
            res.status(500).json({ message: "Error updating save", error });
        }
    }
}

module.exports = new PostController();