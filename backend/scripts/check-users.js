const mongoose = require('mongoose');
const User = require('../models/User');
const GithubAccount = require('../models/GithubAccount');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log('\n--- USERS IN DATABASE ---');
    users.forEach(u => {
      console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, githubConnected: ${u.githubConnected}, githubUsername: "${u.githubUsername}"`);
    });

    const accounts = await GithubAccount.find({});
    console.log('\n--- GITHUB ACCOUNTS IN DATABASE ---');
    accounts.forEach(a => {
      console.log(`ID: ${a._id}, UserRef: ${a.user}, Username: "${a.username}", githubId: "${a.githubId}"`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

check();
