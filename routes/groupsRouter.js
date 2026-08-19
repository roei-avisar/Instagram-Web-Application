const express = require('express');
const router = express.Router(); 
const groupsController = require('../controllers/groupsController');

router.post('/createGroup', groupsController.createGroup);
router.get('/getGroups', groupsController.getAllGroups);
router.delete('/deleteSpecificGroup/:groupId', groupsController.deleteGroup);
router.patch('/joinExistingGroup/:groupId', groupsController.joinGroup);
router.patch('/leaveExistingGroup/:groupId', groupsController.leaveGroup);
router.patch('/removeUserFromGroup/:groupId', groupsController.removeUser);
router.get('/viewGroupMembers/:groupId', groupsController.getGroupMembers);


module.exports = router; // export all the router functions to be used by server.js