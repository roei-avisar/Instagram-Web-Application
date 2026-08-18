const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');

router.post('/register', userController.register);

router.post('/login', userController.login);

router.get('/logout', userController.logout);

router.get('/me', userController.me);

module.exports = router; // export all the router functions to be used by server.js
