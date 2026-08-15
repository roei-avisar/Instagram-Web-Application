const mongoose = require('mongoose');


// Build the MongoDB connection URI from env vars.
// Uses MONGO_URI if set, otherwise builds from DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME.
function getMongoURI() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  const user = encodeURIComponent(process.env.DB_USER);
  const pass = encodeURIComponent(process.env.DB_PASS);
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;
  return `mongodb://${user}:${pass}@${host}:${port}/${dbName}`;
}

const connectDB = async () => {
  try {
    await mongoose.connect(getMongoURI());
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB, getMongoURI };