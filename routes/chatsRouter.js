const express = require('express');
const router = express.Router(); 
const chatsController = require('../controllers/chatsController');
const xssValidator = require('../middleware/xssValidator');

// Apply XSS validation globally to all routes in this router
router.use(xssValidator);

router.post('/createMessage', chatsController.createMessage);
router.patch('/updateMessage', chatsController.updateMessage);
router.post('/deleteSpecificMessage', chatsController.deleteMessage);
router.post('/searchForAMessage', chatsController.searchMessage);
router.post('/getAllMessages', chatsController.getAllMessages);

module.exports = router; // export all the router functions to be used by server.js