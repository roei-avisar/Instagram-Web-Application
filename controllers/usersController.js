const User = require('../models/usersModel');
const { encrypt, decrypt } = require('../utils/encryption');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

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

      // Must have at least email or phone
      if (!email && !phone) {
        return res.status(400).json({ error: 'Email or phone number is required.' });
      }
      // Validate email format if provided
      if (email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Please enter a valid email address.' });
        }
      }
      // Validate phone format if provided
      if (phone) {
        const phoneRegex = /^\d{10,15}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({ error: 'Phone number must contain between 10 and 15 digits.' });
        }
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
      // Block dangerous characters that could be used for XSS, NoSQL injection, or command injection
      const dangerousCharsRegex = /[<>"'`${};|\\]/;
      if (dangerousCharsRegex.test(password)) {
        return res.status(400).json({ error: 'Password contains characters that are not allowed: < > \" \' ` $ { } ; | \\' });
      }

      // Check if email is already taken
      if (email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(409).json({ error: 'An account with this email already exists.' });
        }
      }

      // Check if phone number is already taken
      if (phone) {
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
          return res.status(409).json({ error: 'An account with this phone number already exists.' });
        }
      }

      // Create user (password is hashed automatically by the pre-save hook)
      const user = new User({ email, phone, username, password });
      await user.save();

      // Auto-login after registration (store the original plaintext username in the session)
      req.session.userId = user._id;
      req.session.username = username; // use original plaintext, not the encrypted version from DB

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
      const phoneRegex = /^\d{10,15}$/;
      if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
        return res.status(400).json({ error: 'Please enter a valid email address or a phone number containing only digits.' });
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
      // Block dangerous characters that could be used for XSS, NoSQL injection, or command injection
      const dangerousCharsRegex = /[<>"'`${};|\\]/;
      if (dangerousCharsRegex.test(password)) {
        return res.status(400).json({ error: 'Password contains characters that are not allowed: < > \" \' ` $ { } ; | \\' });
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

    uploadSingle(req, res, function (err) {
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
      return res.json({ message: 'Profile picture updated.', profilePic: profilePicUrl });
    });
  }

  // PUT /api/user/update
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
        // Block dangerous characters
        const dangerousCharsRegex = /[<>"'`${};|\\]/;
        if (dangerousCharsRegex.test(bio)) {
          return res.status(400).json({ error: 'Bio contains characters that are not allowed.' });
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
        const dangerousCharsRegex = /[<>"'`${};|\\]/;
        if (dangerousCharsRegex.test(newPassword)) {
          return res.status(400).json({ error: 'Password contains characters that are not allowed.' });
        }

        user.password = newPassword; // will be hashed by pre-save hook
      }

      await user.save();

      // Build the current profile picture URL so the client can update its global
      const profilePicPath = path.join(__dirname, '..', 'images', 'profiles', req.session.userId + '.jpg');
      let profilePic = '/images/profiles/Default_pfp.jpg';
      if (fs.existsSync(profilePicPath)) {
        profilePic = '/images/profiles/' + req.session.userId + '.jpg?t=' + Date.now();
      }

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

      // Check if the user has a custom profile picture file on disk
      const profilePicPath = path.join(__dirname, '..', 'images', 'profiles', req.session.userId + '.jpg');
      let profilePic = '/images/profiles/Default_pfp.jpg'; // default picture
      if (fs.existsSync(profilePicPath)) {
        profilePic = '/images/profiles/' + req.session.userId + '.jpg?t=' + Date.now();
      }

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

        // Check if this user has a custom profile picture on disk
        const profilePicPath = path.join(__dirname, '..', 'images', 'profiles', user._id.toString() + '.jpg');
        let profilePic = '/images/profiles/Default_pfp.jpg';
        if (fs.existsSync(profilePicPath)) {
          profilePic = '/images/profiles/' + user._id.toString() + '.jpg?t=' + Date.now();
        }

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

  // POST /api/user/follow
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

  // POST /api/user/unfollow
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
}

module.exports = new UserController();
