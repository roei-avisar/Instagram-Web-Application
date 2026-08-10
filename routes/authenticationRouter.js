const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const email = req.body.email;
    const phone = req.body.phone;
    const username = req.body.username;
    const password = req.body.password;

    // Must have at least email or phone
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }
    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      // $or is a MongoDB operator that allows you to query based on multiple conditions.
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
        { username }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }
      return res.status(409).json({ error: 'An account with this email or phone already exists.' });
    }

    // Create user (password is hashed automatically by the pre-save hook)
    const user = new User({ email, phone, username, password });
    await user.save();

    // Auto-login after registration
    req.session.userId = user._id;
    req.session.username = user.username;

    return res.status(201).json({ message: 'User registered successfully.', username: user.username });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const identifier = req.body.identifier; // email or phone
    const password = req.body.password;

    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
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

    // Create session
    req.session.userId = user._id;
    req.session.username = user.username;

    return res.json({ message: 'Login successful.', username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out.' });
    }
    //clear cookie named connect.sid (connect.sid is the default name of the session cookie)
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
});


module.exports = router;
