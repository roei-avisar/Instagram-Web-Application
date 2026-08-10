const express = require('express');
const router = express.Router();
const authenticationController = require('../controllers/authenticationController');

router.post('/register', authenticationController.register);

router.post('/login', authenticationController.login);

router.get('/logout', authenticationController.logout);

module.exports = router; // export all the router functions to be used by server.js
