const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

router.get('/community-size', statisticsController.getCommunitySize);
router.get('/top-creators', statisticsController.getTopCreators);
router.get('/engagement-rate', statisticsController.getEngagementRate);
router.get('/media-distribution', statisticsController.getMediaDistribution);
router.get('/posts-timeline', statisticsController.getPostsTimeline);

module.exports = router;