const mongoose = require('mongoose');
const ContributorScore = require('../models/ContributorScore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkScores = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const scores = await ContributorScore.find({}).populate('user');
    console.log(`Found ${scores.length} scores:`);
    scores.forEach((s, idx) => {
      console.log(`[${idx}] ID: ${s._id}, name: "${s.name}", role: "${s.role}", user: ${s.user ? s.user.name : 'null'}, score: ${s.contributionScore}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkScores();
