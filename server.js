require('dotenv').config(); // load .env variables
const express = require('express'); // import to express framework
const path = require('path'); // import to path library
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { connectDB, getMongoURI } = require('./db');
const authRoutes = require('./routes/auth');
const { requireLogin } = require('./middleware/auth');

const app = express(); // app is our server
const port = 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json()); // parse JSON bodies from fetch requests
app.use(express.urlencoded({ extended: true })); // parse form data

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: getMongoURI(),
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Auth API routes
app.use('/api', authRoutes);

// Login page — publicly accessible
app.get('/', (req, res) => {
  // If already logged in, redirect to main page
  if (req.session && req.session.userId) {
    return res.redirect('/main');
  }
  res.sendFile(path.join(__dirname, 'views', 'instagram_login.html')); // at first login send the login page to the user
});

// Main page — protected, requires login
app.get('/main', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'main-page.html'));
});

// Serve static files from views folder (css, js, images etc.)
app.use(express.static(path.join(__dirname, 'views'))); // if the client will ask for a file in our "views" folder we will return it to him (like js or css files)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`); // runing the server by "node server.js" on console
});