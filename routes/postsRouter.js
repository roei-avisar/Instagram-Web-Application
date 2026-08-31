const express = require('express');
const router = express.Router();
const postController = require('../controllers/postsController');

// Route to get all posts (GET /api/posts/getAllPosts)
router.get('/getAllPosts', postController.getAllPosts);

// Route to get filtered feed posts for the current user
router.get('/getFeedPosts', postController.getFeedPosts);

// Route to create a new post (POST /api/posts/createPost/)
router.post('/createPost/', postController.createPost);

// Route to delete a post by ID (DELETE /api/posts/deletePost/:id)
router.delete('/deletePost/:id', postController.deletePost);

// Post actions routes like, save, and add comment
router.post('/like/:id', postController.managelikesPost);
router.post('/save/:id', postController.manageSavePost);
router.post('/addComment/:id', postController.addComment);

// Route to like or unlike a comment
router.post('/likeComment/:id', postController.manageCommentLike);

// Route to update a post's text fields (PATCH /api/posts/updatePost/:id)
router.patch('/updatePost/:id', postController.updatePost);

// Route to delete multiple posts by their IDs (DELETE /api/posts/deleteMultiplePosts)
router.delete('/deleteMultiplePosts', postController.deleteMultiplePosts);

// Route to get filtered post
router.post('/advancedSearch', postController.advancedFeedSearch);

module.exports = router;