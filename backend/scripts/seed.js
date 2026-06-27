const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const GithubAccount = require('../models/GithubAccount');
const GithubRepository = require('../models/GithubRepository');
const GithubCommit = require('../models/GithubCommit');
const GithubPullRequest = require('../models/GithubPullRequest');
const GithubReview = require('../models/GithubReview');
const GithubIssue = require('../models/GithubIssue');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedUsers = [
  {
    name: 'Admin User',
    email: 'indugula.balu@gmail.com',
    password: 'balu_2005',
    role: 'Admin',
    status: 'active'
  },
  {
    name: 'Project Manager User',
    email: 'indugula.balu+pm@gmail.com',
    password: 'balu_2005',
    role: 'Project Manager',
    status: 'active'
  },
  {
    name: 'Team Lead User',
    email: 'indugula.balu+lead@gmail.com',
    password: 'balu_2005',
    role: 'Team Lead',
    status: 'active'
  },
  {
    name: 'Developer User',
    email: 'indugula.balu+dev@gmail.com',
    password: 'balu_2005',
    role: 'Developer',
    status: 'active'
  },
  {
    name: 'Tester User',
    email: 'indugula.balu+tester@gmail.com',
    password: 'balu_2005',
    role: 'Tester',
    status: 'active'
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Purging existing database collections...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});
    await ActivityLog.deleteMany({});
    await Notification.deleteMany({});
    await Report.deleteMany({});
    await GithubAccount.deleteMany({});
    await GithubRepository.deleteMany({});
    await GithubCommit.deleteMany({});
    await GithubPullRequest.deleteMany({});
    await GithubReview.deleteMany({});
    await GithubIssue.deleteMany({});
    console.log('All existing collections successfully purged.');

    console.log('Seeding Admin user...');
    for (const u of seedUsers) {
      const user = await User.create(u);
      console.log(`Created user: ${user.name} (${user.role}) - Email: ${user.email}`);
    }

    console.log('Database successfully cleaned and initialized with Admin user!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
