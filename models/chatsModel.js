const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({ // A single message schema
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'shared_post'], // Help secure it to only these two options!
        default: 'text',
        required: true
    },
    content: {
        type: String,
        required: function() { // Only required if the user is sharing a text (message type is text)
            return this.type === 'text';
        }
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post',
        required: function() { // Only required if the user is sharing a post (message type is post)
            return this.type === 'shared_post';
        }
    }
}, { timestamps: true }); // Added timestamps- both createdAt and updatedAt

const chatSchema = new mongoose.Schema({ // A single chat with multiple messages schema
    users: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        validate: [ // making sure this chat have 2 users exactly (because every chat must have 2 users)
            function(val) {
                return val.length === 2;
            },
            'The {PATH} array must contain exactly 2 items.'
        ]
    },

    messages: [messageSchema] // array or messages in the type os the schema above
}, { timestamps: true}); // Added timestamps- both createdAt and updatedAt

module.exports = mongoose.model('Chat', chatSchema, 'chats');