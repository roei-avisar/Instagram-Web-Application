const Group = require('../models/groupsModel');
const { Post } = require('../models/postsModel');
const { GetUsernameByUserID } = require('../utils/userHelper');;

class StatisticsController {
    async getCommunitySize(req, res) {
        try {
            const stats = await Group.aggregate([ // foreach group in groups
                {
                    $project: { // return name of each group and size of usera array
                        name: 1,
                        usersCount: { $size: "$users" }
                    }
                },
                {
                    $sort: { usersCount: -1 } // desc sort
                },
                {
                    $limit: 5 // only top 5 groups with most users
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    async getTopCreators(req, res) {
        try {
            const stats = await Post.aggregate([ // foreach post in posts
                { $unwind: "$authors" }, // make duplicate post for each author (while you have post with more than 1 author)
                {
                    $group: { // group by authors and sum their all posts
                        _id: "$authors", 
                        postCount: { $sum: 1 } 
                    }
                },
                { $sort: { postCount: -1 } }, // desc sort
                { $limit: 5 } // only top 5
            ]);

            const userIds = stats.map(s => s._id); // make list of IDs
            const usernamesList = await GetUsernameByUserID(userIds); //decrypt

            const finalStats = stats.map(stat => {
                const userMatch = usernamesList.find(u => u.userId.toString() === stat._id.toString()); // map between UserID to Username
                return {
                    _id: stat._id,
                    postCount: stat.postCount,
                    username: userMatch && userMatch.username ? userMatch.username : "Unknown"
                };
            });

            res.status(200).json({ success: true, data: finalStats });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getEngagementRate(req, res) {
        try {
            const stats = await Group.aggregate([ // foreach group in groups
                {
                    $project: { // return for each group their name and size of users and posts array
                        name: 1,
                        usersCount: { $size: "$users" },
                        postsCount: { $size: "$posts" }
                    }
                },
                {
                    $match: { usersCount: { $gt: 0 } } // filter only the groups with at least 1 user (greater than 0)
                },
                {
                    $project: { // for each post in the filtered list return name of each group and average published posts for users numbers
                        name: 1,
                        engagementRatio: { $divide: ["$postsCount", "$usersCount"] }
                    }
                },
                {
                    $sort: { engagementRatio: -1 } // desc sort
                },
                {
                    $limit: 5 // only top 5
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getMediaDistribution(req, res) {
        try {
            const stats = await Post.aggregate([ // for each post at posts
                {
                    $group: { // group by mediaType (video, photo, text) and summerize it
                        _id: "$mediaType",
                        count: { $sum: 1 }
                    }
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
            console.error(error);
        }
    }

    async getPostsTimeline(req, res) {
        try {
            const stats = await Post.aggregate([ // for each post at posts
                {
                    $group: { // group by same year and month of created post and summerize it
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } // inc sort
                }
            ]);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
            console.error(error);
        }
    }
}

module.exports = new StatisticsController();