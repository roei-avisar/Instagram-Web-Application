require('dotenv').config(); // load .env variables
const express = require('express'); // import to express framework
const path = require('path'); // import to path library
const session = require('express-session');
const connectMongo = require('connect-mongo'); //allows you to save user session in mongodb
const MongoStore = connectMongo.default || connectMongo; 
const { connectDB, getMongoURI } = require('./config/db');
const apiRouter = require('./routes'); // central router that combines all API routers (user, post, etc.)
const { requireLogin } = require('./middleware/userMiddleware');
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
  store: MongoStore.create({ // store session in mongodb
    mongoUrl: getMongoURI(),
    collectionName: 'sessions' // collection name for sessions
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// API routes
app.use('/api', apiRouter); // mounts all API routes under /api (e.g. /api/user/login, /api/user/register)

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

// Block direct access to .html files — prevents IDOR bypass via static file serving
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    return res.redirect('/');
  }
  next();
});

// Serve static files from views folder (css, js, images etc.)
app.use(express.static(path.join(__dirname, 'views'))); // serves only non-html assets (css, js, images) since .html is blocked above

app.listen(port, () => {
  console.log(`Server is running on port ${port}`); // runing the server by "node server.js" on console
});