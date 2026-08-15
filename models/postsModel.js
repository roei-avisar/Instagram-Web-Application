const mongoose = require('mongoose');

// Post stats schema definition  - likes, comments, and shares
const statsSchema = new mongoose.Schema({
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
}, { _id: false });

// Post schema definition
const postSchema = new mongoose.Schema({
    authors: [{ type: String, required: true }],
    isVerified: { type: Boolean, default: false },
    timeAgo: { type: String, required: true },
    subHeader: { type: String, default: "" },
    mediaType: { type: String, enum: ['image', 'video', 'text'], required: true },
    mediaSource: { type: String, required: true },
    audioSource: { type: String, default: null },
    hasMuteButton: { type: Boolean, default: false },
    stats: { type: statsSchema, default: () => ({}) },
    likedByUsers: [{ type: String }],
    caption: { type: String, default: "" },
    isSuggested: { type: Boolean, default: false }
});

// Create and export the Mongoose model
module.exports = mongoose.model('Post', postSchema);