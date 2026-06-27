const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load configurations
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const UserSession = require('../models/UserSession');

const API_URL = 'http://localhost:5000/api';

// Helper to make HTTP requests
const makeRequest = (method, path, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
};

const runTests = async () => {
  console.log('==================================================');
  console.log('🧪 TESTING DEV METRICS INTELLIGENCE MODULES (DB-LINKED)');
  console.log('==================================================\n');

  let adminSession = null;
  let devSession = null;
  let testerSession = null;

  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
    console.log(`🔗 Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Database.\n');

    // 1. Retrieve Admin user
    const adminUser = await User.findOne({ role: /admin/i });
    if (!adminUser) throw new Error('No Admin user found in database. Run seed script first.');

    // 2. Retrieve Developer user
    const devUser = await User.findOne({ role: /developer/i });
    if (!devUser) throw new Error('No Developer user found in database. Please register/create a Developer user first.');

    // 3. Retrieve Tester user
    const testerUser = await User.findOne({ role: /tester/i });
    if (!testerUser) throw new Error('No Tester user found in database. Please register/create a Tester user first.');

    console.log(`👤 Found Users:\n   - Admin: ${adminUser.email}\n   - Developer: ${devUser.email}\n   - Tester: ${testerUser.email}\n`);

    // 4. Generate & Insert Session for Admin
    const secret = process.env.JWT_SECRET || 'devmetrics_secret_key';
    
    const adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, secret, { expiresIn: '1h' });
    adminSession = await UserSession.create({
      user: adminUser._id,
      token: adminToken,
      device: 'Intelligence E2E Test Suite',
      ip: '127.0.0.1',
      isRevoked: false
    });

    // 5. Generate & Insert Session for Developer
    const devToken = jwt.sign({ id: devUser._id, role: devUser.role }, secret, { expiresIn: '1h' });
    devSession = await UserSession.create({
      user: devUser._id,
      token: devToken,
      device: 'Intelligence E2E Test Suite',
      ip: '127.0.0.1',
      isRevoked: false
    });

    // 6. Generate & Insert Session for Tester
    const testerToken = jwt.sign({ id: testerUser._id, role: testerUser.role }, secret, { expiresIn: '1h' });
    testerSession = await UserSession.create({
      user: testerUser._id,
      token: testerToken,
      device: 'Intelligence E2E Test Suite',
      ip: '127.0.0.1',
      isRevoked: false
    });

    console.log('🔑 Programmatic HTTP Bearer Sessions successfully registered.\n');

    // -----------------------------------------------------------------
    // TEST 1: Dev Accessing Bus Factor (Should be Forbidden 403)
    // -----------------------------------------------------------------
    console.log('🧪 [Test 1] Developer accessing Bus Factor Analytics (restricted)...');
    const devBfRes = await makeRequest('GET', '/analytics/bus-factor', devToken);
    console.log(`   Response Status: ${devBfRes.statusCode}`);
    if (devBfRes.statusCode === 403) {
      console.log('✅ Correctly blocked developer access (403 Forbidden)!\n');
    } else {
      throw new Error(`RBAC Failure! Developer was not blocked. Status: ${devBfRes.statusCode}`);
    }

    // -----------------------------------------------------------------
    // TEST 2: Dev Accessing Project Risk (Should be Forbidden 403)
    // -----------------------------------------------------------------
    console.log('🧪 [Test 2] Developer accessing Project Risk Analytics (restricted)...');
    const devRiskRes = await makeRequest('GET', '/analytics/project-risk', devToken);
    console.log(`   Response Status: ${devRiskRes.statusCode}`);
    if (devRiskRes.statusCode === 403) {
      console.log('✅ Correctly blocked developer access (403 Forbidden)!\n');
    } else {
      throw new Error(`RBAC Failure! Developer was not blocked. Status: ${devRiskRes.statusCode}`);
    }

    // -----------------------------------------------------------------
    // TEST 3: Tester Accessing Bus Factor (Should be Forbidden 403)
    // -----------------------------------------------------------------
    console.log('🧪 [Test 3] Tester accessing Bus Factor Analytics (restricted)...');
    const testerBfRes = await makeRequest('GET', '/analytics/bus-factor', testerToken);
    console.log(`   Response Status: ${testerBfRes.statusCode}`);
    if (testerBfRes.statusCode === 403) {
      console.log('✅ Correctly blocked tester access (403 Forbidden)!\n');
    } else {
      throw new Error(`RBAC Failure! Tester was not blocked. Status: ${testerBfRes.statusCode}`);
    }

    // -----------------------------------------------------------------
    // TEST 4: Tester Accessing Project Risk (Should be Allowed 200)
    // -----------------------------------------------------------------
    console.log('🧪 [Test 4] Tester accessing Project Risk Analytics (allowed)...');
    const testerRiskRes = await makeRequest('GET', '/analytics/project-risk', testerToken);
    console.log(`   Response Status: ${testerRiskRes.statusCode}`);
    if (testerRiskRes.statusCode === 200) {
      console.log('✅ Correctly allowed tester access (200 OK)!\n');
    } else {
      throw new Error(`Access Failure! Tester was blocked. Status: ${testerRiskRes.statusCode}`);
    }

    // -----------------------------------------------------------------
    // TEST 5: Dev Accessing Knowledge Distribution (Should be Allowed 200 with Team View)
    // -----------------------------------------------------------------
    console.log('🧪 [Test 5] Developer accessing Knowledge Distribution (allowed - team view)...');
    const devKdRes = await makeRequest('GET', '/analytics/knowledge-distribution', devToken);
    console.log(`   Response Status: ${devKdRes.statusCode}`);
    if (devKdRes.statusCode === 200) {
      const isTeamView = devKdRes.data.data?.isTeamView;
      console.log(`   isTeamView Enforced: ${isTeamView}`);
      if (isTeamView === true) {
        console.log('✅ Correctly returned Team View filtered data!\n');
      } else {
        throw new Error('Verification failure: Developer view did not filter with isTeamView flag.');
      }
    } else {
      throw new Error(`Access Failure! Developer was blocked. Status: ${devKdRes.statusCode}`);
    }

    // -----------------------------------------------------------------
    // TEST 6: Admin Accessing All Modules (Should be Allowed 200)
    // -----------------------------------------------------------------
    console.log('🧪 [Test 6] Admin fetching Project Risk, Bus Factor, and Knowledge Distribution...');
    
    const adminRiskRes = await makeRequest('GET', '/analytics/project-risk', adminToken);
    const adminBfRes = await makeRequest('GET', '/analytics/bus-factor', adminToken);
    const adminKdRes = await makeRequest('GET', '/analytics/knowledge-distribution', adminToken);

    console.log(`   Risk Res: ${adminRiskRes.statusCode} | Bus Factor Res: ${adminBfRes.statusCode} | Knowledge Res: ${adminKdRes.statusCode}`);
    
    if (adminRiskRes.statusCode === 200 && adminBfRes.statusCode === 200 && adminKdRes.statusCode === 200) {
      console.log(`   - Risk: "${adminRiskRes.data.data.projectName}" | Risk Score: ${adminRiskRes.data.data.projectRiskScore}%`);
      console.log(`   - Bus Factor: "${adminBfRes.data.data.repositoryName}" | BF Score: ${adminBfRes.data.data.busFactorScore}`);
      console.log(`   - Knowledge: "${adminKdRes.data.data.repositoryName}" | isTeamView: ${adminKdRes.data.data.isTeamView}`);
      console.log('✅ Correctly returned full datasets for Administrator role!\n');
    } else {
      throw new Error('Access Failure: Admin could not retrieve metrics.');
    }

    console.log('==================================================');
    console.log('🎉 ALL INTELLIGENCE E2E RBAC API TESTS PASSED!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ API VERIFICATION FAILED:', error.message);
  } finally {
    console.log('\n🧹 Cleaning up test session tokens from DB...');
    if (adminSession) await UserSession.findByIdAndDelete(adminSession._id);
    if (devSession) await UserSession.findByIdAndDelete(devSession._id);
    if (testerSession) await UserSession.findByIdAndDelete(testerSession._id);
    console.log('✅ Sessions cleaned.');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from DB.');
    process.exit(0);
  }
};

runTests();
