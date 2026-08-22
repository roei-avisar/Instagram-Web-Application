const express = require('express');
const router = express.Router();

const userRouter = require('./usersRouter');

// Mount each resource router under its own prefix
// All user-related routes: /api/user/...
router.use('/user', userRouter);

// Future routers can be added here, for example:
// const postRouter = require('./postRouter');
// router.use('/post', postRouter);

// const commentRouter = require('./commentRouter');
// router.use('/comment', commentRouter);

module.exports = router;
