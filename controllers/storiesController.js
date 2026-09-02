const Story = require('../models/storiesModel');
const User = require('../models/usersModel');
const gitService = require('../utils/gitService');
const mongoose = require('mongoose');

class StoriesController {

  // GET /api/stories/getFeedStories
  async getFeedStories(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const currentUserId = req.session.userId;
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) return res.status(404).json({ error: 'User not found' });

      // Calculate the time 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Find stories from users the current user follows + their own stories
      const usersToFetch = [...currentUser.following, currentUserId];

      const activeStories = await Story.find({
        author: { $in: usersToFetch },
        createdAt: { $gt: twentyFourHoursAgo }
      }).populate('author', 'username profilePic').sort({ createdAt: -1 });

      // Clean up expired stories directly in DB
      const expiredStories = await Story.find({
        createdAt: { $lt: twentyFourHoursAgo }
      });

      for (const story of expiredStories) {
        let relativePath = '/../views/' + story.mediaSource;
        gitService.deleteMediaAndPushToGit(relativePath);
        await Story.findByIdAndDelete(story._id);
      }

      // Group stories by author
      const groupedStoriesMap = new Map();

      activeStories.forEach(story => {
        if (!story.author) return;
        const authorId = story.author._id.toString();

        let authorUsername = story.author.username;
        try {
          // if someone decides he want to use .lean() for some reason 
          // the function won't be there, so we need to check if it exists
          // if someone reads this you probably fucked up
          if (typeof story.author.decryptUsername === 'function') {
            authorUsername = story.author.decryptUsername();
          }
          // keeps the code run even if someone fucks up
        } catch (e) { }

        if (!groupedStoriesMap.has(authorId)) {
          groupedStoriesMap.set(authorId, {
            author: {
              _id: authorId,
              username: authorUsername,
              profilePic: story.author.profilePic
            },
            isCurrentUser: authorId === currentUserId.toString(),
            stories: []
          });
        }

        groupedStoriesMap.get(authorId).stories.push({
          _id: story._id,
          mediaType: story.mediaType,
          mediaSource: story.mediaSource,
          createdAt: story.createdAt
        });
      });

      // Convert map to array
      let feed = Array.from(groupedStoriesMap.values());

      // Sort feed by the most recent story of each user (descending)
      feed.sort((a, b) => {
        const latestA = new Date(a.stories[0].createdAt).getTime();
        const latestB = new Date(b.stories[0].createdAt).getTime();
        return latestB - latestA;
      });

      // Put the current user first if they have stories
      const currentUserIndex = feed.findIndex(g => g.author._id.toString() === currentUserId.toString());

      let currentUserGroup = null;
      if (currentUserIndex > -1) {
        currentUserGroup = feed.splice(currentUserIndex, 1)[0];
        feed.unshift(currentUserGroup);
      }

      return res.json({ feed });
    } catch (err) {
      console.error('getFeedStories error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // POST /api/stories/createStory
  async createStory(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { mediaType, mediaSource } = req.body;
      if (!mediaType || !mediaSource) {
        return res.status(400).json({ error: 'Missing media details' });
      }

      let ext = mediaType === 'video' ? 'mp4' : 'jpg';
      let fileName = `story_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
      let relativePath = `/../views/elements/media/stories/${fileName}`;
      let dbPath = `elements/media/stories/${fileName}`;

      gitService.saveMediaAndPushToGit(mediaSource, relativePath);

      const newStory = new Story({
        author: req.session.userId,
        mediaType: mediaType,
        mediaSource: dbPath
      });

      await newStory.save();

      return res.status(201).json({ message: 'Story created successfully', story: newStory });
    } catch (err) {
      console.error('createStory error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE /api/stories/deleteStory/:id
  async deleteStory(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const storyId = req.params.id;
      const story = await Story.findById(storyId);

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      if (story.author.toString() !== req.session.userId) {
        return res.status(403).json({ error: 'Unauthorized to delete this story' });
      }

      let relativePath = `/../views/${story.mediaSource}`;
      gitService.deleteMediaAndPushToGit(relativePath);

      await Story.findByIdAndDelete(storyId);

      return res.json({ message: 'Story deleted successfully' });
    } catch (err) {
      console.error('deleteStory error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new StoriesController();
