const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('../utils/encryption');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: false,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  bio: {
    type: String,
    default: '',
    maxlength: 150
  },
  profilePic: {
    type: String,
    default: '/elements/media/profile-pictures/Default_pfp.jpg'
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  personalPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetCode: {
    type: String,
    default: null
  },
  resetCodeExpires: {
    type: Date,
    default: null
  }
});

// Hash password and encrypt username before saving
userSchema.pre('save', async function () {
  // Encrypt username if it was changed (stores encrypted in DB)
  if (this.isModified('username')) {
    this.username = encrypt(this.username);
  }
  
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Hash resetCode if modified and not null
  if (this.isModified('resetCode') && this.resetCode !== null) {
    const salt = await bcrypt.genSalt(10);
    this.resetCode = await bcrypt.hash(this.resetCode, salt);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  // compare function from bcrypt compares the candidate password with the stored one (hashed)
  return bcrypt.compare(candidatePassword, this.password);
};
// Compare reset code method
userSchema.methods.compareResetCode = async function (candidateCode) {
  if (!this.resetCode) return false;
  return bcrypt.compare(candidateCode, this.resetCode);
};
// Decrypt username method — returns the original plaintext username
userSchema.methods.decryptUsername = function () {
  return decrypt(this.username);
};

module.exports = mongoose.model('User', userSchema, 'users');
