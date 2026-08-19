require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express'); // import express framework
const cors = require('cors');
const path = require('path'); // import path library
const groupsRouter = require('./routes/groupsRouter');


const app = express(); // app is our server
const port = 3000;

app.use(express.json()); // accept json format

const corsOptions = {
    origin: ['http://localhost:3000','http://127.0.0.1:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('Failed to connect to MongoDB', err)); // connect to mongo server in singleton

app.use(express.static(path.join(__dirname, 'views'))); // if the client will ask for a file in our "views" folder we will return it to him (like js or css files)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'instagram_login.html')); // at first login send the login page to the user
});

app.use('/api/groups', groupsRouter); // redirect to group router all the /groups requests


app.listen(port, () => {
  console.log(`Server is running on port ${port}`); // runing the server by "node server.js" on console
});