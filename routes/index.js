const express = require('express');
const router = express.Router();

const userRouter = require('./usersRouter');
const groupsRouter = require('./groupsRouter');

// Mount each resource router under its own prefix
router.use('/user', userRouter);
router.use('/groups', groupsRouter);

// Future routers can be added here, for example:
// const postRouter = require('./postRouter');
// router.use('/post', postRouter);

module.exports = router;