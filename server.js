require('dotenv').config(); // load .env variables
const express = require('express'); // import to express framework
const path = require('path'); // import to path library
const session = require('express-session');
const { MongoStore } = require('connect-mongo'); //allows you to save user session in mongodb
const { connectDB, getMongoURI } = require('./db');
const authRoutes = require('./routes/authenticationRouter');
const { requireLogin } = require('./middleware/auth');

const app = express(); // app is our server
const port = 3301;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json()); // parse JSON bodies from fetch requests
app.use(express.urlencoded({ extended: true })); // parse form data

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET, // secret key for saving user session
  resave: false, // prevents saving session if it wasn't changed
  saveUninitialized: false, // prevents saving session if it wasn't initialized
  store: MongoStore.create({
    mongoUrl: getMongoURI(), // store session in mongodb
    collectionName: 'sessions' // collection name for sessions
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Auth API routes
app.use('/api', authRoutes); // routes for login, logout, register and puts /api in front of the routes in auth.js

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
app.use(express.static(path.join(__dirname, 'views'))); // if the client will ask for a file it will check if it's in the views folder and if it is it will return it to the client 

app.listen(port, () => {
  console.log(`Server is running on port ${port}`); // runing the server by "node server.js" on console
});