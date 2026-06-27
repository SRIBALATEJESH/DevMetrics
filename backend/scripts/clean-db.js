const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Clearing metrics collection contents...');
    await mongoose.connection.db.collection('contributorscores').deleteMany({});
    await mongoose.connection.db.collection('repositorymetrics').deleteMany({});
    await mongoose.connection.db.collection('reviewmetrics').deleteMany({});
    await mongoose.connection.db.collection('issuemetrics').deleteMany({});
    await mongoose.connection.db.collection('engineeringhealths').deleteMany({});

    console.log('All metrics collections cleared. Running recalculation...');
    const { recalculateAllMetrics } = require('../services/analyticsEngineService');
    await recalculateAllMetrics();

    console.log('Cleanup and recalculation complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};
run();
