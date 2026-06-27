const mongoose = require('mongoose');
const User = require('../models/User');
const GithubAccount = require('../models/GithubAccount');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetConnections = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Reset user fields
    const usersResult = await User.updateMany(
      {},
      {
        githubConnected: false,
        githubUsername: '',
        githubId: '',
        githubAvatar: '',
        githubAccessToken: ''
      }
    );
    console.log(`Successfully reset GitHub fields for ${usersResult.modifiedCount} users.`);

    // 2. Clear GithubAccount collection
    const accountsResult = await GithubAccount.deleteMany({});
    console.log(`Successfully deleted ${accountsResult.deletedCount} GithubAccount records.`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error during database update:', err);
  }
};

resetConnections();
