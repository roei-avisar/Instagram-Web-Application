const Chat = require('../models/chatsModel');

class chatsController {

    async createMessage(req, res) {
        try {
            
            const { sender, receiver, type, content, postId } = req.body;

            // Check the universal/base requirements
            // If not- return an accurate response
            if (!sender || !receiver || !type) {
                return res.status(400).json({
                    success: false,
                    message: "Missing sender, receiver, or message type"
                });
            }

            // Check the specific requirements based on the type of the message
            if (type === 'text' && !content) {
                return res.status(400).json({
                    success: false,
                    message: "Text messages must include content"
                });
            }

            if (type === 'shared_post' && !postId) {
                return res.status(400).json({
                    success: false,
                    message: "Shared posts must include a postId"
                });
            }

            // Create the new message with relevant information
            const newMessage = { 
                sender: sender, 
                type: type 
            };

            if (type === 'text'){
                newMessage.content = content;
            }
            else if (type === 'shared_post'){
                newMessage.postId = postId;
            }

            // Find the relevant chat between the sender and the receiver (if there is one)
            let chat = await Chat.findOne({ 
                users: { $all: [sender, receiver] } 
            });

            // If no chat exists, create a new chat
            if (!chat) {
                chat = new Chat({
                    users: [sender, receiver],
                    messages: []
                });
            }

            // Push the new message into the messages array and save the chat
            chat.messages.push(newMessage);
            const savedChat = await chat.save();

            // Send the correct success response
            res.status(201).json({
                success: true,
                message: "Message create successfully",
                data: savedChat
            });

        } catch (error) { // Handle the error if it occurs in server and return an accurate response
            res.status(500).json({
                success: false,
                message: "Internal server error while creating the message",
                error: error.message
            });
        }
    }

    async updateMessage(req, res) {
        try {
            
            const { updatedContent, messageId, senderId, receiverId } = req.body;

            // Check to make sure all the needed parameters are there!
            // If not- return an accurate response
            if (!updatedContent || !messageId || !senderId || !receiverId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields"
                });
            }

            let chat = await Chat.findOne({ 
                users: { $all: [senderId, receiverId] } 
            });

            // Check to make sure the chat between these two users exist!
            // If not- return an accurate response
            if (!chat){
                return res.status(404).json({
                    success: false,
                    message: "Chat not found"
                });
            }

            // Find the specific message by its ID among all the chat messages
            const messageToUpdate = chat.messages.id(messageId);

            // Check to make sure the message that needed to update was found (that the given message ID was connected to a real message)
            // If not- return an accurate response
            if (!messageToUpdate){
                return res.status(404).json({
                    success: false,
                    message: "Message not found"
                });
            }

            // Prevent editing messages of shared posts
            if (messageToUpdate.type !== 'text') {
                return res.status(400).json({
                    success: false,
                    message: "Only text messages can be edited"
                });
            }

            // Ensure the person trying to edit is actually the one who sent it- by the senderId
            if (messageToUpdate.sender.toString() !== senderId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to edit this message"
                });
            }

            // Change the specific message by its ID and save the changes in the chat
            messageToUpdate.content = updatedContent;
            await chat.save();


            // Send the correct success response
            res.status(200).json({
                success: true,
                message: "Message edited successfully",
                data: messageToUpdate
            });

        } catch (error) {
            res.status(500).json({ // Handle the error if it occurs in server and return an accurate response
                success: false,
                message: "Error editing the message",
                error: error.message
            });
        }
    }

    async deleteMessage(req, res) {
        try {
            
            const { messageId, senderId, receiverId } = req.body; 

            // Check to make sure all the needed parameters are there!
            // If not- return an accurate response
            if (!messageId || !senderId || !receiverId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields"
                });
            }

            let chat = await Chat.findOne({ 
                users: { $all: [senderId, receiverId] } 
            });

            // Check to make sure the chat between these two users exist!
            // If not- return an accurate response
            if (!chat){
                return res.status(404).json({
                    success: false,
                    message: "Chat not found"
                });
            }

            // Find the specific message by its ID among all the chat messages
            const messageToDelete = chat.messages.id(messageId);

            // Check to make sure the message that we want to delete exist
            // If not- return an accurate response
            if (!messageToDelete){
                return res.status(404).json({
                    success: false,
                    message: "Message not found"
                });
            }

            // Ensure the person trying to delete is actually the one who sent it (by senderId) and allow to delete it
            if (messageToDelete.sender.toString() !== senderId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to delete this message"
                });
            }

            chat.messages.pull(messageId);    
            await chat.save();            

            // Send the correct success response
            res.status(200).json({
                success: true,
                message: "Message deleted successfully",
                data: { deletedMessageId: messageId }
            });

        } catch (error) { // Handle the error if it occurs and return an accurate response
            res.status(500).json({
                success: false,
                message: "Error deleting message",
                error: error.message
            });
        }
    }

    async searchMessage(req, res) {
        try {
            
            const { messageSearch, senderId, receiverId } = req.body; 

            // Check to make sure all the needed parameters are there!
            // If not- return an accurate response
            if (!messageSearch || !senderId || !receiverId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields"
                });
            }

            let chat = await Chat.findOne({ 
                users: { $all: [senderId, receiverId] } 
            });

            // Check to make sure the chat between these two users exist!
            // If not- return an accurate response
            if (!chat){
                return res.status(404).json({
                    success: false,
                    message: "Chat not found"
                });
            }

            // Search text in all the messages with filter + includes
            const allMessages = chat.messages.filter(msg => 
                msg.type === 'text' && msg.content.toLowerCase().includes(messageSearch.toLowerCase()));            

            // Send the correct success response
            res.status(200).json({
                success: true,
                message: "Messages searched successfully",
                data: allMessages
            });

        } catch (error) { // Handle the error if it occurs and return an accurate response
            res.status(500).json({
                success: false,
                message: "Error searching for messages",
                error: error.message
            });
        }
    }

    async getAllMessages(req, res) {
        try {
            const { senderId, receiverId } = req.body; 

            // Check to make sure all the needed parameters are there!
            // If not- return an accurate response
            if (!senderId || !receiverId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields"
                });
            }

            let chat = await Chat.findOne({ 
                users: { $all: [senderId, receiverId] } 
            }).populate('messages.postId');

            // Check to make sure the chat between these two users exist!
            // If not- return an accurate response
            if (!chat){
                return res.status(200).json({
                    success: true,
                    message: "No chat history found (new chat)",
                    data: [] // return empty chat
                });
            }

            // Send the correct success response
            res.status(200).json({
                success: true,
                message: "All messages were fetched successfully",
                data: chat.messages
            });

        } catch (error) { // Handle the error if it occurs and return an accurate response
            res.status(500).json({
                success: false,
                message: "Error fetching all messages",
                error: error.message
            });
        }
    }
}

module.exports = new chatsController();