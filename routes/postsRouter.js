const express = require('express');
const router = express.Router();
const postController = require('../controllers/postsController');

// Route to get all posts (GET /api/posts/getAllPosts)
router.get('/getAllPosts', postController.getAllPosts);

// Route to create a new post (POST /api/posts/createPost/)
router.post('/createPost/', postController.createPost);

// Route to delete a post by ID (DELETE /api/posts/deletePost/:id)
router.delete('/deletePost/:id', postController.deletePost);

module.exports = router;