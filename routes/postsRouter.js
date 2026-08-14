const express = require('express');
const router = express.Router();
const postController = require('../controllers/postsController');

// Route to get all posts (GET /api/posts)
router.get('/', postController.getAllPosts);

// Route to create a new post (POST /api/posts)
router.post('/', postController.createPost);

// Route to delete a post by ID (DELETE /api/posts/:id)
router.delete('/:id', postController.deletePost);

module.exports = router;