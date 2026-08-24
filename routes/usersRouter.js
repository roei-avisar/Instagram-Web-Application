const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');

router.post('/register', userController.register);

router.post('/login', userController.login);

router.get('/logout', userController.logout);

router.put('/update', userController.updateProfile);

router.post('/uploadProfilePic', userController.uploadProfilePic);

router.get('/getUserDetails', userController.getUserDetails);

router.get('/allUsers', userController.getAllUsers);

router.post('/follow', userController.followUser);

router.post('/unfollow', userController.unfollowUser);

module.exports = router; // export all the router functions to be used by server.js
