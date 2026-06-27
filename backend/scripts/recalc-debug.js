const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { recalculateAllMetrics } = require('../services/analyticsEngineService');
const ContributorScore = require('../models/ContributorScore');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Triggering metric recalculation...');
    await recalculateAllMetrics();
    console.log('Recalculation complete.');

    const scores = await ContributorScore.find({}).populate('user');
    console.log('\n--- AFTER RECALCULATION ---');
    scores.forEach((s, idx) => {
      console.log(`[${idx}] ID: ${s._id}, name: "${s.name}", role: "${s.role}", user: ${s.user ? s.user.name : 'null'}, score: ${s.contributionScore}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};
run();
