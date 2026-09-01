const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const xssValidator = require('../middleware/xssValidator');
const { requireLogin } = require('../middleware/userMiddleware');

// Apply XSS validation globally to all routes in this router
router.use(xssValidator);

router.post('/register', userController.register);

router.post('/login', userController.login);

router.get('/logout', requireLogin, userController.logout);

router.patch('/update', requireLogin, userController.updateProfile);

router.post('/uploadProfilePic', requireLogin, userController.uploadProfilePic);

router.get('/getUserDetails', requireLogin, userController.getUserDetails);

router.post('/username', requireLogin, userController.getUsername);

router.get('/allUsers', requireLogin, userController.getAllUsers);

router.patch('/follow', requireLogin, userController.followUser);

router.patch('/unfollow', requireLogin, userController.unfollowUser);

router.get('/check_followers', requireLogin, userController.check_followers);

router.get('/check_following', requireLogin, userController.check_following);

router.delete('/delete', requireLogin, userController.deleteUser);

router.post('/addPersonalPost', requireLogin, userController.addPersonalPost);

router.delete('/removePersonalPost/:postId', requireLogin, userController.removePersonalPost);

router.get('/getFollowingAndPersonalPosts', requireLogin, userController.getFollowingAndPersonalPosts);

router.post("/getBasicInfo", requireLogin, userController.getBasicInfo);

router.post('/advancedSearch', requireLogin, userController.advancedUserSearch);

router.post('/requestPasswordReset', userController.requestPasswordReset);

router.post('/resetPasswordWithCode', userController.resetPasswordWithCode);

module.exports = router; // export all the router functions to be used by server.js
