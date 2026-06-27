const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Achievement = require('../models/Achievement');
const User = require('../models/User');
const RepositoryMetrics = require('../models/RepositoryMetrics');
const Notification = require('../models/Notification');
require('../models/GithubRepository');

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const achievements = await Achievement.find({}).populate('user', 'name');
    console.log(`Found ${achievements.length} achievements:`);
    achievements.forEach(a => {
      console.log(`- [${a.user ? a.user.name : 'Unknown'}] Key: ${a.badgeKey}, Title: "${a.title}", Icon: ${a.icon}`);
    });

    const ActivityLog = require('../models/ActivityLog');
    const logsCount = await ActivityLog.countDocuments({});
    console.log(`\nTotal ActivityLogs in DB: ${logsCount}`);
    if (logsCount > 0) {
      const sampleLog = await ActivityLog.findOne({});
      console.log(`Sample log: user=${sampleLog.user}, event="${sampleLog.event}", date=${sampleLog.createdAt || sampleLog.timestamp}`);
    }

    // Seed some test logs for Anji Indugula to test streak logic
    const anji = await User.findOne({ name: /Anji/i });
    if (anji) {
      console.log(`Seeding test logs for Anji to verify streak count...`);
      // Delete existing test logs to avoid duplication
      await ActivityLog.deleteMany({ user: anji._id, event: /Test Streak Log/ });

      // Create log for today (June 27)
      const today = new Date();
      await ActivityLog.create({
        user: anji._id,
        event: 'Test Streak Log - Today',
        timestamp: today
      });

      // Create log for yesterday (June 26)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await ActivityLog.create({
        user: anji._id,
        event: 'Test Streak Log - Yesterday',
        timestamp: yesterday
      });

      console.log('Recalculating after seeding...');
      const { recalculateAllMetrics } = require('../services/analyticsEngineService');
      await recalculateAllMetrics();
    }

    const users = await User.find({}, 'name streakCount lastContributionDate');
    console.log(`\nStreaks of all users:`);
    users.forEach(u => {
      console.log(`- ${u.name}: streakCount=${u.streakCount}, lastContribution=${u.lastContributionDate}`);
    });

    const repos = await RepositoryMetrics.find({}).populate('repository', 'name');
    console.log(`\nRepository Health Scores:`);
    repos.forEach(r => {
      console.log(`- ${r.name || (r.repository ? r.repository.name : 'Unknown')}: Health Score = ${r.healthScore}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};
run();
