const mongoose = require('mongoose');

// Post stats schema definition  - likes, comments, and shares
const statsSchema = new mongoose.Schema({
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
}, { _id: false });

// Location schema definition - stores geographic information for posts
// Includes place name and coordinates (lat/lng) for map rendering
const locationSchema = new mongoose.Schema({
    name: { type: String, default: "" },      // The location string/name (e.g., "Tel Aviv")
    lat: { type: Number, default: null },     // Latitude coordinate
    lng: { type: Number, default: null }      // Longitude coordinate
}, { _id: false });

// Post schema definition
const postSchema = new mongoose.Schema({
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    groupAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isVerified: { type: Boolean, default: false },
    location: { type: locationSchema, default: () => ({ name: "", lat: null, lng: null }) },
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