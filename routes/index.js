const express = require('express');
const router = express.Router();

const userRouter = require('./usersRouter');
const postsRouter = require('./postsRouter');

// Mount each resource router under its own prefix
// All user-related routes: /api/user/...
router.use('/user', userRouter);
router.use('/posts', postsRouter);

// Future routers can be added here, for example:
// const postRouter = require('./postRouter');
// router.use('/post', postRouter);

// const commentRouter = require('./commentRouter');
// router.use('/comment', commentRouter);

module.exports = router;
