const express = require('express'); // import to express framework
const path = require('path'); // import to path library
const app = express(); // app is our server
const port = 3000;


app.use(express.static(path.join(__dirname, 'views'))); // if the client will ask for a file in our "views" folder we will return it to him (like js or css files)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'instagram_login.html')); // at first login send the login page to the user
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`); // runing the server by "node server.js" on console
});