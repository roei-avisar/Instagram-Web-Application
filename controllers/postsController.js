const { Post, Comment } = require('../models/postsModel');

class PostController {
    // Controller method to handle fetching all posts
    async getAllPosts(req, res) {
        try {
            // Fetch all posts and sort them by MongoDB's built-in _id (newest first)
            const posts = await Post.find().sort({ _id: -1 });
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ message: "Error fetching posts from database", error });
        }
    }

    // Controller method to handle creating a new post in the database
    async createPost(req, res) {
        try {
            const newPostData = req.body;
            
            // Create a new Mongoose document and save it to the database
            const newPost = new Post(newPostData);
            const createdPost = await newPost.save();
            
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
            const { username, text } = req.body;
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

    // Handle liking/unliking a post
    async managelikesPost(req, res) {
        try {
            const { username } = req.body;
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
            const { username } = req.body;
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