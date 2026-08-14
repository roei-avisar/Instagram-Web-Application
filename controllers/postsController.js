const PostModel = require('../models/postsModel');

// Controller function to handle fetching all posts
exports.getAllPosts = async (req, res) => {
    try {
        // Fetch all posts and sort them by MongoDB's built-in _id (newest first)
        const posts = await PostModel.find().sort({ _id: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts from database", error });
    }i
};

// Controller function to handle creating a new post in the database
exports.createPost = async (req, res) => {
    try {
        const newPostData = req.body;
        
        // Create a new Mongoose document and save it to the database
        const newPost = new PostModel(newPostData);
        const createdPost = await newPost.save();
        
        res.status(201).json(createdPost);
    } catch (error) {
        res.status(500).json({ message: "Error creating post in database", error });
    }
};

// Controller function to handle deleting a post
exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id; 
        
        // Use Mongoose's built-in findByIdAndDelete with the MongoDB _id
        const deletedPost = await PostModel.findByIdAndDelete(postId);
        
        if (deletedPost) {
            res.status(200).json({ message: "Post deleted successfully" });
        } else {
            res.status(404).json({ message: "Post not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error deleting post from database", error });
    }
};