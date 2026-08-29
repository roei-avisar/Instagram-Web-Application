const Group = require('../models/groupsModel');
const Post = require('../models/postsModel');

class StatisticsController {
    async getCommunitySize(req, res) {
        try {
            const stats = await Group.aggregate([
                {
                    $project: {
                        name: 1,
                        usersCount: { $size: "$users" }
                    }
                },
                {
                    $sort: { usersCount: -1 }
                },
                {
                    $limit: 5
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getTopCreators(req, res) {
        try {
            const stats = await Post.aggregate([
                {
                    $unwind: "$authors"
                },
                {
                    $group: {
                        _id: "$authors",
                        postCount: { $sum: 1 }
                    }
                },
                {
                    $sort: { postCount: -1 }
                },
                {
                    $limit: 5
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getEngagementRate(req, res) {
        try {
            const stats = await Group.aggregate([
                {
                    $project: {
                        name: 1,
                        usersCount: { $size: "$users" },
                        postsCount: { $size: "$posts" }
                    }
                },
                {
                    $match: { usersCount: { $gt: 0 } }
                },
                {
                    $project: {
                        name: 1,
                        engagementRatio: { $divide: ["$postsCount", "$usersCount"] }
                    }
                },
                {
                    $sort: { engagementRatio: -1 }
                },
                {
                    $limit: 5
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getMediaDistribution(req, res) {
        try {
            const stats = await Post.aggregate([
                {
                    $group: {
                        _id: "$mediaType",
                        count: { $sum: 1 }
                    }
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getPostsTimeline(req, res) {
        try {
            const stats = await Post.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1 }
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new StatisticsController();