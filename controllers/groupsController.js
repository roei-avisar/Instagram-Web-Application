const Group = require('../models/groupsModel');
const { sendTweet } = require('../utils/twitterServices');

// Helper function to delete posts using their IDs array
async function deleteGroupPostsHelper(postIds, req) {
    if (!postIds || postIds.length === 0) return;

    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        await fetch(`${baseUrl}/api/posts/deleteMultiplePosts`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie 
            },
            body: JSON.stringify({ postIds: postIds })
        });
    } catch (error) {
        console.error(`Error deleting group posts:`, error);
    }
}

class GroupsController {
    async createGroup(req, res) { // creating a new group on DB and making the user admin
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { name, adminId } = req.body;

            const newGroup = new Group({ // create new group from model schema
                name: name,
                admin: adminId,
                users: [adminId]
            });

            const savedGroup = await newGroup.save(); // save group in DB

            const tweetMessage = `A new group name "${req.body.name}" were created in our App!`;
            sendTweet(tweetMessage); // tweet to our twitter user

            res.status(201).json({
                success: true,
                message: "Group created successfully",
                data: savedGroup
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Error by creating a new group",
                error: error.message
            });
        }
    }

    async getAllGroups (req, res) { // get all groups in DB
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const groups = await Group.find();

            res.status(200).json({ success: true, count: groups.length, data: groups });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deleteGroup(req, res) { // delete the group if the user is the admin
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const groupId = req.params.groupId;
            const userId = req.body.userId;

            const group = await Group.findById(groupId); // find the group by groupID

            if (!group) {
                return res.status(404).json({ success: false });
            }

            if (group.admin.toString() !== userId) { // check if the user who deleting the group is the admin
                return res.status(403).json({ success: false, message: "Only admin can delete the group"});
            }

            // Call the helper function to delete all posts in this group using the group posts array
            await deleteGroupPostsHelper(group.posts, req);

            await Group.findByIdAndDelete(groupId); //  find and deleting the group

            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    async joinGroup(req, res) { // adding a user to a group
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const groupId = req.params.groupId;
            const userId = req.body.userId;

            const group = await Group.findByIdAndUpdate( // if group doesnt exist return null
                groupId,
                { $addToSet: { users: userId } }, // adding the userID to the users array
                { returnDocument: 'after' } // return the updated group
            );

            if (!group) { 
                return res.status(404).json({ success: false });
            }

            res.status(200).json({ success: true, data: group });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    async leaveGroup(req, res) { // deleting user from group by user request
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const groupId = req.params.groupId;
            const userId = req.body.userId;

            const group = await Group.findByIdAndUpdate(
                groupId,
                { $pull: { users: userId } },
                { returnDocument: 'after' }
            );

            if (!group) {
                return res.status(404).json({ success: false });
            }

            res.status(200).json({ success: true, data: group });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    async removeUser(req, res) { // remove user from group by admin
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const groupId = req.params.groupId;
            const adminId = req.body.adminId;
            const userIdToRemove = req.body.userIdToRemove;

            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(404).json({ success: false });
            }

            if (group.admin.toString() !== adminId) { // check if the admin requsted it
                return res.status(403).json({ success: false });
            }

            const updatedGroup = await Group.findByIdAndUpdate(
                groupId,
                { $pull: { users: userIdToRemove } },
                { returnDocument: 'after' }
            );

            res.status(200).json({ success: true, data: updatedGroup });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    async getGroupMembers(req, res) { // get all the group members
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const groupId = req.params.groupId;

            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(404).json({ success: false });
            }

            res.status(200).json({ success: true, data: group.users });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }
    async renameGroup(req, res) { // rename the group by admin user
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { newName } = req.body;
            const groupId = req.params.groupId;
            const userId = req.session.userId;

            if (!newName || newName.length > 60) {
                return res.status(400).json({ error: 'Invalid group name' });
            }
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            if (group.admin.toString() !== userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            group.name = newName;
            await group.save();

            res.json(group);
        } 
        catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }
    async getUserGroups(req, res) { // get all the groups that the user is a member of
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: "User not logged in" });
            }

            const userGroups = await Group.find({ users: userId });

            res.status(200).json({ success: true, data: userGroups });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async addPostToGroup(req, res) { // add a post to a specific group
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { postId, groupId } = req.body;
            const userId = req.session.userId;

            if (!userId) return res.status(401).json({ success: false, message: "User not logged in" });
            if (!postId || !groupId) return res.status(400).json({ success: false, message: "Invalid data provided" });

            await Group.findByIdAndUpdate(
                groupId,
                { $addToSet: { posts: postId } }
            );

            res.status(200).json({ success: true, message: "Post added to group successfully" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async removePostFromGroup(req, res) { // remove a post from a specific group
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { groupId, postId } = req.params;
            const userId = req.session.userId;

            if (!userId) return res.status(401).json({ success: false, message: "User not logged in" });

            const group = await Group.findById(groupId);
            if (!group) return res.status(404).json({ success: false, message: "Group not found" });

            const updatedGroup = await Group.findByIdAndUpdate(
                groupId,
                { $pull: { posts: postId } },
                { returnDocument: 'after' }
            );

            res.status(200).json({ success: true, data: updatedGroup });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // GET /api/groups/getMyGroupsPosts
    async getMyGroupsPosts(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const userId = req.session.userId;

            // Find all groups where the user is a member
            const userGroups = await Group.find({ users: userId });
            const postIds = [];

            // Extract all post IDs from these groups
            userGroups.forEach(group => {
                if (group.posts) {
                    postIds.push(...group.posts.map(id => id.toString()));
                }
            });

            // Remove duplicates using Set
            const uniquePostIds = [...new Set(postIds)];

            return res.status(200).json({ success: true, postIds: uniquePostIds });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    async removeUserFromAllGroups(req, res) { // while deleting a user this function removes this user from all the groups he was a member and deleting the groups he created
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const userId = req.params.userId;

            // Find all groups where the user is the admin and delete their posts and the groups themselves
            const groupsToDelete = await Group.find({ admin: userId }); 
            
            // Iterate and delete posts for each group using the helper function and the group's posts array
            for (const group of groupsToDelete) {
                await deleteGroupPostsHelper(group.posts, req);
            }

            const deletedGroups = await Group.deleteMany({ admin: userId });

            const updatedGroups = await Group.updateMany( // find all the groups that the user is a member and removing him
                { users: userId },
                { $pull: { users: userId } }
            );

            return res.status(200).json({
                success: true,
                stats: {
                    groupsDeleted: deletedGroups.deletedCount,
                    groupsLeft: updatedGroups.modifiedCount
                }
            });

        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    async advancedGroupSearch(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { searchTerm, showOnlyMine, timeFilter } = req.body;
            const userId = req.session.userId;
            
            // Build the Advanced MongoDB Query
            let query = {};
            
            // Search by group name
            if (searchTerm && searchTerm.trim() !== '') {
                query.name = { $regex: searchTerm, $options: 'i' };
            }
            
            // Filter by membership (my groups only)
            if (showOnlyMine && userId) {
                query.users = userId; 
            }
            
            // Filter by creation time
            if (timeFilter && timeFilter !== 'all') {
                const date = new Date();
                if (timeFilter === '24h') {
                    date.setHours(date.getHours() - 24);
                } else if (timeFilter === 'week') {
                    date.setDate(date.getDate() - 7);
                }
                query.createdAt = { $gte: date };
            }
            
            // Execute Query in DB
            const groups = await Group.find(query).sort({ createdAt: -1 });
            
            res.status(200).json({ success: true, count: groups.length, data: groups });
        } catch (error) {
            console.error("Error executing group advanced search:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new GroupsController();