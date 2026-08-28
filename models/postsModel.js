const mongoose = require('mongoose');

// Post stats schema definition  - likes, comments, and shares
const statsSchema = new mongoose.Schema({
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
}, { _id: false });

// Post schema definition
const postSchema = new mongoose.Schema({
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    isVerified: { type: Boolean, default: false },
    timeAgo: { type: String, required: true },
    subHeader: { type: String, default: "" },
    mediaType: { type: String, enum: ['image', 'video', 'text'], required: true },
    mediaSource: { type: String, required: true },
    audioSource: { type: String, default: null },
    stats: { type: statsSchema, default: () => ({}) },
    likedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    caption: { type: String, default: "" },
    isSuggested: { type: Boolean, default: false },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    createdAt: { type: Date, default: Date.now }
});

// Comment schema definition
const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

// Create and export the Mongoose model
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Post, Comment };