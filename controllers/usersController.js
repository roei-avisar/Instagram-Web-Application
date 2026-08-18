const User = require('../models/usersModel');
const { encrypt, decrypt } = require('../utils/encryption');

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

  // GET /api/user/me
  me(req, res) {
    if (req.session && req.session.username) {
      return res.json({ username: req.session.username });
    } else {
      return res.status(401).json({ error: 'Not authenticated' });
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
}

module.exports = new UserController();
