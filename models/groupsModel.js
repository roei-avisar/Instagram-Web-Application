const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }]
});

module.exports = mongoose.model('Group', groupSchema, 'groups');