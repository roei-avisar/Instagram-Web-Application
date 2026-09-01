const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/userMiddleware');

const userRouter = require('./usersRouter');
const postsRouter = require('./postsRouter');
const groupsRouter = require('./groupsRouter');
const storiesRouter = require('./storiesRouter');
const { requireLogin } = require('../middleware/userMiddleware');

// Mount each resource router under its own prefix
router.use('/user', userRouter);
router.use('/posts', requireLogin, postsRouter);
router.use('/groups', requireLogin, groupsRouter);
router.use('/chats', requireLogin, chatsRouter);
router.use('/stories', requireLogin, storiesRouter);
router.use('/statistics', requireLogin, statisticsRouter);

// Future routers can be added here, for example:
// const postRouter = require('./postRouter');
// router.use('/post', postRouter);

module.exports = router;