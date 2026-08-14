const express = require('express'); // Import express framework
const path = require('path'); // Import path library
const app = express(); // App is our server
const port = 3000;

// Import the post routes
const postsRouter = require('./routes/postsRouter');

// Built-in middleware to parse incoming JSON requests
app.use(express.json());

// If the client asks for a file in our "views" folder, return it (like js or css files)
app.use(express.static(path.join(__dirname, 'views'))); 

// Mount the routes to the standard RESTful endpoint
app.use('/api/posts', postsRouter);

app.get('/', (req, res) => {
  // At first login send the login page to the user
  res.sendFile(path.join(__dirname, 'views', 'instagram_login.html')); 
});

// Route to serve the main feed page directly
app.get('/main', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'main-page.html'));
});

app.listen(port, () => {
  // Running the server by "node server.js" on console
  console.log(`Server is running on port ${port}`); 
});