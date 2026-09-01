const express = require('express');
const router = express.Router();

const userRouter = require('./usersRouter');
const postsRouter = require('./postsRouter');
const groupsRouter = require('./groupsRouter');
const storiesRouter = require('./storiesRouter');
const { requireLogin } = require('../middleware/userMiddleware');

// Mount each resource router under its own prefix
router.use('/user', userRouter);
router.use('/posts', postsRouter);
router.use('/groups', groupsRouter);
router.use('/stories', requireLogin, storiesRouter);

// Future routers can be added here, for example:
// const postRouter = require('./postRouter');
// router.use('/post', postRouter);

module.exports = router;