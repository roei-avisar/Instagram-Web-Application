const User = require('../models/usersModel');
const { encrypt, decrypt } = require('../utils/encryption');
const { GetUsernameByUserID } = require('../utils/userHelper');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { sendTweet } = require('../utils/twitterServices');

// Configure multer for profile picture uploads
// Files are saved to images/profiles/ and named by the user's ID
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'images', 'profiles'));
  },
  filename: function (req, file, cb) {
    // Name the file as <userId>.jpg so we can find it later
    cb(null, req.session.userId + '.jpg');
  }
});

// Only allow JPG files — reject everything else (PNG, GIF, etc.)
const fileFilter = function (req, file, cb) {
  if (file.mimetype === 'image/jpeg') {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only JPG files are allowed.'), false); // Reject the file
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Max file size: 5MB
});

// Controller class that handles all authntication logic (register, login, logout)
class UserController {

  // POST /api/user/register
  async register(req, res) {
    try {
      const email = req.body.email;
      const phone = req.body.phone;
      const username = req.body.username;
      const password = req.body.password;

      // Both email and phone are required
      if (!email) {
        return res.status(400).json({ error: 'Email address is required.' });
      }
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required.' });
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      // Validate phone format (supports Israel format including +972/05x and international format)
      const phoneRegex = /^(?:\+?972[- ]?(?:5[0-9]|[23489]|7[1-9])|0(?:5[0-9]|[23489]|7[1-9]))[- ]?\d{3}[- ]?\d{4}$|^\+?[1-9]\d{9,14}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid phone number (e.g. 050-1234567 or +972-50-1234567).' });
      }
      if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
      }
      if (username.length > 30) {
        return res.status(400).json({ error: 'Username cannot exceed 30 characters.' });
      }
      // Username: only allow letters, numbers, underscores, and dots (blocks XSS, injection attacks)
      const usernameRegex = /^[a-zA-Z0-9_.]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and dots.' });
      }

      // Check if username is already taken (usernames are encrypted in DB, so we decrypt and compare)
      const allUsers = await User.find({}, 'username');
      const usernameTaken = allUsers.some(u => {
        try {
          return u.decryptUsername().toLowerCase() === username.toLowerCase();
        } catch {
          return false;
        }
      });
      if (usernameTaken) {
        return res.status(409).json({ error: 'This username is already taken.' });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      if (password.includes(' ')) {
        return res.status(400).json({ error: 'Password cannot contain spaces.' });
      }


      // Check if email is already taken
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      // Check if phone number is already taken
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(409).json({ error: 'An account with this phone number already exists.' });
      }

      // Create user (password is hashed automatically by the pre-save hook)
      const user = new User({ email, phone, username, password });
      await user.save();

      // Auto-login after registration (store the original plaintext username in the session)
      req.session.userId = user._id;
      req.session.username = username; // use original plaintext, not the encrypted version from DB

      const tweetMessage = `A new user were joined to our App!`;
      sendTweet(tweetMessage); // tweet to our twitter user

      return res.status(201).json({ message: 'User registered successfully.', username: username });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }

  // POST /api/user/login
  async login(req, res) {
    try {
      const identifier = req.body.identifier; // email or phone
      const password = req.body.password;

      if (!identifier) {
        return res.status(400).json({ error: 'Email or phone number is required.' });
      }
      // Validate identifier format (must be a valid email or phone number)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const phoneRegex = /^(?:\+?972[- ]?(?:5[0-9]|[23489]|7[1-9])|0(?:5[0-9]|[23489]|7[1-9]))[- ]?\d{3}[- ]?\d{4}$|^\+?[1-9]\d{9,14}$/;
      if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
        return res.status(400).json({ error: 'Please enter a valid email address or phone number.' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Password is required.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      if (password.includes(' ')) {
        return res.status(400).json({ error: 'Password cannot contain spaces.' });
      }


      // Find user by email or phone
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phone: identifier }
        ]
      });

      if (!user) {
        return res.status(401).json({ error: 'No account found with that email or phone number.' });
      }

      // Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }

      // Create session (decrypt the username so the user sees the original plaintext)
      req.session.userId = user._id;
      req.session.username = user.decryptUsername();

      return res.json({ message: 'Login successful.', username: user.decryptUsername() });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }



  // POST /api/user/uploadProfilePic
  // Handles profile picture upload — only accepts JPG files
  uploadProfilePic(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Use multer to handle the file upload (the field name in the form is 'profilePic')
    const uploadSingle = upload.single('profilePic');

    uploadSingle(req, res, async function (err) {
      // If multer rejected the file (e.g. not a JPG or too large)
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image is too large. Please upload a file smaller than 5MB.' });
        }
        // Our fileFilter already sets err.message to 'Only JPG files are allowed.'
        return res.status(400).json({ error: err.message || 'Upload failed.' });
      }

      // If no file was sent at all
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      // The file is already saved as <userId>.jpg by multer's storage config
      // (if an old file existed, multer overwrites it automatically)
      const profilePicUrl = '/images/profiles/' + req.session.userId + '.jpg?t=' + Date.now();

      try {
        const user = await User.findById(req.session.userId);
        if (user) {
          user.profilePic = profilePicUrl;
          await user.save();
        }
        return res.json({ message: 'Profile picture updated.', profilePic: profilePicUrl });
      } catch (dbErr) {
        console.error('Error saving profile picture to DB:', dbErr);
        return res.status(500).json({ error: 'Database error while saving profile picture.' });
      }
    });
  }

  // PATCH /api/user/update
  async updateProfile(req, res) {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const username = req.body.username;
      const bio = req.body.bio;
      const currentPassword = req.body.currentPassword;
      const newPassword = req.body.newPassword;
      const user = await User.findById(req.session.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Validate and update username
      if (username !== undefined && username !== '') {
        const trimmedUsername = username.trim();

        if (trimmedUsername.length > 30) {
          return res.status(400).json({ error: 'Username cannot exceed 30 characters.' });
        }

        // Username: only allow letters, numbers, underscores, and dots (blocks XSS, injection attacks)
        const usernameRegex = /^[a-zA-Z0-9_.]+$/;
        if (!usernameRegex.test(trimmedUsername)) {
          return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and dots.' });
        }

        // Check if username is already taken by another user
        const allUsers = await User.find({ _id: { $ne: user._id } }, 'username');
        const usernameTaken = allUsers.some(u => {
          try {
            return u.decryptUsername().toLowerCase() === trimmedUsername.toLowerCase();
          } catch {
            return false;
          }
        });
        if (usernameTaken) {
          return res.status(409).json({ error: 'This username is already taken.' });
        }

        user.username = trimmedUsername; // will be encrypted by pre-save hook
        req.session.username = trimmedUsername; // update session with new username
      }

      // Validate and update bio
      if (bio !== undefined) {
        if (bio.length > 150) {
          return res.status(400).json({ error: 'Bio cannot exceed 150 characters.' });
        }

        user.bio = bio;
      }

      // Validate and update password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password.' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }
        if (newPassword.includes(' ')) {
          return res.status(400).json({ error: 'Password cannot contain spaces.' });
        }


        user.password = newPassword; // will be hashed by pre-save hook
      }

      await user.save();

      // Use the current profile picture URL from the database
      let profilePic = user.profilePic || '/images/profiles/Default_pfp.jpg';

      return res.json({
        message: 'Profile updated successfully.',
        username: req.session.username,
        bio: user.bio || '',
        profilePic: profilePic
      });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }

  // GET /api/user/logout
  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Could not log out.' });
      }
      //clear cookie named connect.sid (connect.sid is the default name of the session cookie)
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out successfully.' });
    });
  }

  // GET /api/user/getUserDetails
  async getUserDetails(req, res) {
    if (!req.session || !req.session.userId || !req.session.username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Use the profile picture from the database
      let profilePic = user.profilePic || '/images/profiles/Default_pfp.jpg';

      res.json({
        userId: req.session.userId,
        username: req.session.username,
        bio: user.bio || '',
        profilePic: profilePic
      });
    } catch (err) {
      console.error('getUserDetails error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // GET /api/user/allUsers
  // Returns all users from the DB (except the current user) with follow status
  async getAllUsers(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      // Get the current user to check who they follow
      const currentUser = await User.findById(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get all users except the current user
      const allUsers = await User.find({ _id: { $ne: req.session.userId } });

      // Build a list of user objects to send to the client
      const usersList = [];

      for (const user of allUsers) {
        // Decrypt the username (it is stored encrypted in the DB)
        let username = '';
        try {
          username = user.decryptUsername();
        } catch {
          username = 'Unknown';
        }

        // Use the profile picture from the database
        let profilePic = user.profilePic || '/images/profiles/Default_pfp.jpg';

        // Check if the current user is already following this user
        const isFollowing = currentUser.following.includes(user._id.toString());

        usersList.push({
          userId: user._id,
          username: username,
          bio: user.bio || '',
          profilePic: profilePic,
          isFollowing: isFollowing
        });
      }

      return res.json({ users: usersList });
    } catch (err) {
      console.error('getAllUsers error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // PATCH /api/user/follow
  // Follow another user — adds to both users' arrays
  async followUser(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const targetUserId = req.body.targetUserId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required.' });
    }

    // Cannot follow yourself (not saposed to happen but it for data integrety reasons)
    if (targetUserId === req.session.userId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    try {
      const currentUser = await User.findById(req.session.userId);
      const targetUser = await User.findById(targetUserId);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Check if already following (prevent duplicates)
      if (currentUser.following.includes(targetUserId)) {
        return res.status(400).json({ error: 'You are already following this user.' });
      }

      // Add targetUserId to my "following" list
      currentUser.following.push(targetUserId);
      // Add my ID to the target user's "followers" list
      targetUser.followers.push(req.session.userId);

      await currentUser.save();
      await targetUser.save();

      return res.json({ message: 'Followed successfully.' });
    } catch (err) {
      console.error('Follow error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // PATCH /api/user/unfollow
  // Unfollow another user — removes from both users' arrays
  async unfollowUser(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const targetUserId = req.body.targetUserId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required.' });
    }

    try {
      const currentUser = await User.findById(req.session.userId);
      const targetUser = await User.findById(targetUserId);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Remove targetUserId from my "following" list
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId
      );
      // Remove my ID from the target user's "followers" list
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== req.session.userId
      );

      await currentUser.save();
      await targetUser.save();

      return res.json({ message: 'Unfollowed successfully.' });
    } catch (err) {
      console.error('Unfollow error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }
  // POST /api/user/username
  // Exposes the GetUsernameByUserID helper to the frontend
  // Accepts either { userId: "singleId" } or { userIds: ["id1", "id2"] }
  async getUsername(req, res) {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { userId, userIds } = req.body;

      // If an array of IDs was sent
      if (Array.isArray(userIds)) {
        const results = await GetUsernameByUserID(userIds);
        return res.json({ usernames: results });
      }

      // If a single ID was sent
      if (userId) {
        const username = await GetUsernameByUserID(userId);
        if (!username) {
          return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ username: username });
      }

      return res.status(400).json({ error: 'Please provide userId (string) or userIds (array).' });
    } catch (err) {
      console.error('getUsername error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // GET /api/user/check_followers
  // Returns the list of users who follow a given user (or the current user if no userId is provided)
  async check_followers(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const targetId = req.query.userId || req.session.userId;
      const user = await User.findById(targetId).populate('followers');

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const followersList = user.followers.map(follower => {
        let username = 'Unknown';
        try {
          username = follower.decryptUsername();
        } catch { /* keep Unknown */ }

        return {
          userId: follower._id,
          username: username,
          bio: follower.bio || '',
          profilePic: follower.profilePic || '/images/profiles/Default_pfp.jpg'
        };
      });

      return res.json({ followers: followersList, count: followersList.length });
    } catch (err) {
      console.error('check_followers error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // GET /api/user/check_following
  // Returns the list of users that a given user follows (or the current user if no userId is provided)
  async check_following(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const targetId = req.query.userId || req.session.userId;
      const user = await User.findById(targetId).populate('following');

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const followingList = user.following.map(followed => {
        let username = 'Unknown';
        try {
          username = followed.decryptUsername();
        } catch { /* keep Unknown */ }

        return {
          userId: followed._id,
          username: username,
          bio: followed.bio || '',
          profilePic: followed.profilePic || '/images/profiles/Default_pfp.jpg'
        };
      });

      return res.json({ following: followingList, count: followingList.length });
    } catch (err) {
      console.error('check_following error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // DELETE /api/user/delete
  // Permanently deletes the logged-in user and cleans up their follower/following links across all users
  async deleteUser(req, res) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.userId;

    try {
      // Remove this user from the 'followers' array of any user they were following
      await User.updateMany(
        { followers: userId },
        { $pull: { followers: userId } }
      );

      // Remove this user from the 'following' array of any user who was following them
      await User.updateMany(
        { following: userId },
        { $pull: { following: userId } }
      );

      // Delete user's profile picture file from disk if it exists
      const userProfilePicPath = path.join(__dirname, '..', 'images', 'profiles', `${userId}.jpg`);
      if (fs.existsSync(userProfilePicPath)) {
        try {
          fs.unlinkSync(userProfilePicPath);
        } catch (fileErr) {
          console.error('Error deleting profile pic file:', fileErr);
        }
      }

      // Delete the user document from the database
      const deletedUser = await User.findByIdAndDelete(userId);
      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Destroy the session and clear cookie
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session during user delete:', err);
        }
        res.clearCookie('connect.sid');
        return res.json({ message: 'Account deleted successfully.' });
      });
    } catch (err) {
      console.error('deleteUser error:', err);
      return res.status(500).json({ error: 'Server error while deleting account.' });
    }
  }

  // POST /api/user/addPersonalPost
  async addPersonalPost(req, res) {
    try {
      const { postId } = req.body;
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      await User.findByIdAndUpdate(
        req.session.userId,
        { $addToSet: { personalPosts: postId } }
      );
      return res.status(200).json({ success: true, message: 'Added to personal posts' });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE /api/user/removePersonalPost/:postId
  async removePersonalPost(req, res) {
    try {
      const { postId } = req.params;
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      await User.findByIdAndUpdate(
        req.session.userId,
        { $pull: { personalPosts: postId } }
      );
      return res.status(200).json({ success: true, message: 'Removed from personal posts' });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // GET /api/user/getFollowingAndPersonalPosts
  async getFollowingAndPersonalPosts(req, res) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Fetch user and populate their following list to access their personalPosts
      const currentUser = await User.findById(userId).populate('following');
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const postIds = [];

      // Add user's own personal posts
      if (currentUser.personalPosts) {
        postIds.push(...currentUser.personalPosts.map(id => id.toString()));
      }

      // Add personal posts from users they follow
      if (currentUser.following) {
        currentUser.following.forEach(followedUser => {
          if (followedUser.personalPosts) {
            postIds.push(...followedUser.personalPosts.map(id => id.toString()));
          }
        });
      }

      // Remove duplicates using Set
      const uniquePostIds = [...new Set(postIds)];

      return res.status(200).json({ success: true, postIds: uniquePostIds });
    } catch (err) {
      console.error("Error getting personal posts:", err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new UserController();
