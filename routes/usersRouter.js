const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const xssValidator = require('../middleware/xssValidator');

// Apply XSS validation globally to all routes in this router
router.use(xssValidator);

router.post('/register', userController.register);

router.post('/login', userController.login);

router.get('/logout', userController.logout);

router.patch('/update', userController.updateProfile);

router.post('/uploadProfilePic', userController.uploadProfilePic);

router.get('/getUserDetails', userController.getUserDetails);

router.post('/username', userController.getUsername);

router.get('/allUsers', userController.getAllUsers);

router.patch('/follow', userController.followUser);

router.patch('/unfollow', userController.unfollowUser);

router.get('/check_followers', userController.check_followers);

router.get('/check_following', userController.check_following);

router.delete('/delete', userController.deleteUser);

router.post('/addPersonalPost', userController.addPersonalPost);

router.delete('/removePersonalPost/:postId', userController.removePersonalPost);

router.get('/getFollowingAndPersonalPosts', userController.getFollowingAndPersonalPosts);

router.post("/getBasicInfo", userController.getBasicInfo)

router.post('/advancedSearch', userController.advancedUserSearch);

module.exports = router; // export all the router functions to be used by server.js
