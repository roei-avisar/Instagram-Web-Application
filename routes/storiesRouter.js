const express = require('express');
const router = express.Router();
const storiesController = require('../controllers/storiesController');

router.get('/getFeedStories', storiesController.getFeedStories);
router.post('/createStory', storiesController.createStory);
router.delete('/deleteStory/:id', storiesController.deleteStory);

module.exports = router;
