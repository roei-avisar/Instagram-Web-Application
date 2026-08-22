const Group = require('../models/groupsModel');

class GroupsController {
    async createGroup(req, res) { // creating a new group on DB and making the user admin
        try {
            const { name, adminId } = req.body;

            const newGroup = new Group({ // create new group from model schema
                name: name,
                admin: adminId,
                users: [adminId]
            });

            const savedGroup = await newGroup.save(); // save group in DB

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
        try {
            const groups = await Group.find();

            res.status(200).json({ success: true, count: groups.length, data: groups });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deleteGroup(req, res) { // delete the group if the user is the admin
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

            await Group.findByIdAndDelete(groupId); //  find and deleting the group

            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    async joinGroup(req, res) { // adding a user to a group
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
}

module.exports = new GroupsController();