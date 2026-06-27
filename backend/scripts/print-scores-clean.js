const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const scores = await mongoose.connection.db.collection('contributorscores').find({ period: 'all-time' }).toArray();
    console.log(`Found ${scores.length} all-time scores:`);
    scores.forEach((s, idx) => {
      console.log(`[${idx}] _id: ${s._id}, name: "${s.name}", role: "${s.role}", user: ${s.user}, score: ${s.contributionScore}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};
run();
