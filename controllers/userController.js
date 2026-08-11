const User = require('../models/User');

// Controller class that handles all authntication logic (register, login, logout)
class UserController {

  // POST /api/register
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
      // Validate phone format if provided (and no email)
      if (phone && !email) {
        const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({ error: 'Please enter a valid phone number.' });
        }
      }
      if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
      }
      // Username: only allow letters, numbers, underscores, and dots (blocks XSS, injection attacks)
      const usernameRegex = /^[a-zA-Z0-9_.]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and dots.' });
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
  }

  // POST /api/login
  async login(req, res) {
    try {
      const identifier = req.body.identifier; // email or phone
      const password = req.body.password;

      if (!identifier) {
        return res.status(400).json({ error: 'Email or phone number is required.' });
      }
      // Validate identifier format (must be a valid email or phone number)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
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

      // Create session
      req.session.userId = user._id;
      req.session.username = user.username;

      return res.json({ message: 'Login successful.', username: user.username });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }

  // GET /api/logout
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
