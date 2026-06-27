const http = require('http');

const API_URL = 'http://localhost:5000/api';

// Helper to make HTTP requests
const makeRequest = (method, path, body = null, token = null) => {
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

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('==================================================');
  console.log('🚀 STARTING DEV METRICS BACKEND E2E TEST FLOW');
  console.log('==================================================\n');

  let devToken = null;
  let pmToken = null;
  let createdProjectId = null;

  try {
    // -----------------------------------------------------------------
    // TEST 1: Developer Login
    // -----------------------------------------------------------------
    console.log('🧪 [Test 1] Logging in as Developer (dev@devmetrics.com)...');
    const devLoginRes = await makeRequest('POST', '/auth/login', {
      email: 'dev@devmetrics.com',
      password: 'password123'
    });

    if (devLoginRes.statusCode === 200 && devLoginRes.data.token) {
      devToken = devLoginRes.data.token;
      console.log('✅ Developer Login Successful!');
      console.log(`👤 User: ${devLoginRes.data.data.name} | Role: ${devLoginRes.data.data.role}\n`);
    } else {
      throw new Error(`Developer login failed: ${JSON.stringify(devLoginRes.data)}`);
    }

    // -----------------------------------------------------------------
    // TEST 2: Fetch Current User Profile
    // -----------------------------------------------------------------
    console.log('🧪 [Test 2] Fetching Profile using JWT token...');
    const profileRes = await makeRequest('GET', '/auth/me', null, devToken);
    if (profileRes.statusCode === 200) {
      console.log('✅ Fetch Profile Successful!');
      console.log(`   Fetched Info: ${profileRes.data.data.name} (${profileRes.data.data.email})\n`);
    } else {
      throw new Error(`Profile fetch failed: ${JSON.stringify(profileRes.data)}`);
    }

    // -----------------------------------------------------------------
    // TEST 3: RBAC Check - Developer Attempting to Create Project
    // -----------------------------------------------------------------
    console.log('🧪 [Test 3] Testing RBAC: Developer attempting to create project...');
    const createProjectRes = await makeRequest('POST', '/projects', {
      title: 'Hacker Dashboard Project',
      description: 'Unauthorised project attempt'
    }, devToken);

    if (createProjectRes.statusCode === 403) {
      console.log('✅ RBAC Restriction Working! Developer was blocked with 403 Forbidden.');
      console.log(`   Message: "${createProjectRes.data.message}"\n`);
    } else {
      throw new Error(`RBAC Failure! Developer should have been blocked. Status: ${createProjectRes.statusCode}`);
    }

    // -----------------------------------------------------------------
    // TEST 4: Project Manager Login
    // -----------------------------------------------------------------
    console.log('🧪 [Test 4] Logging in as Project Manager (pm@devmetrics.com)...');
    const pmLoginRes = await makeRequest('POST', '/auth/login', {
      email: 'pm@devmetrics.com',
      password: 'password123'
    });

    if (pmLoginRes.statusCode === 200 && pmLoginRes.data.token) {
      pmToken = pmLoginRes.data.token;
      console.log('✅ Project Manager Login Successful!\n');
    } else {
      throw new Error(`PM login failed: ${JSON.stringify(pmLoginRes.data)}`);
    }

    // -----------------------------------------------------------------
    // TEST 5: Project Manager Creating a Project
    // -----------------------------------------------------------------
    console.log('🧪 [Test 5] PM creating a Project...');
    const pmCreateRes = await makeRequest('POST', '/projects', {
      title: 'Automated Test Core Module',
      description: 'Engine core project created via automated scripts',
      status: 'active'
    }, pmToken);

    if (pmCreateRes.statusCode === 201) {
      createdProjectId = pmCreateRes.data.data._id;
      console.log('✅ Project Created Successfully!');
      console.log(`   Project ID: ${createdProjectId} | Title: "${pmCreateRes.data.data.title}"\n`);
    } else {
      throw new Error(`PM project creation failed: ${JSON.stringify(pmCreateRes.data)}`);
    }

    // -----------------------------------------------------------------
    // TEST 6: Fetch Analytics Leaderboard
    // -----------------------------------------------------------------
    console.log('🧪 [Test 6] Fetching Contribution Analytics Leaderboard...');
    const leaderboardRes = await makeRequest('GET', '/analytics/leaderboard', null, devToken);
    if (leaderboardRes.statusCode === 200) {
      console.log('✅ Leaderboard Fetched Successfully!');
      console.log(`   Found ${leaderboardRes.data.results} scored developers:`);
      leaderboardRes.data.data.forEach((entry, idx) => {
        console.log(`   [#${idx + 1}] ${entry.name} (${entry.role}) -> Score: ${entry.contributionScore}`);
      });
      console.log();
    } else {
      throw new Error(`Leaderboard fetch failed: ${JSON.stringify(leaderboardRes.data)}`);
    }

    // -----------------------------------------------------------------
    // TEST 7: Clean up Project
    // -----------------------------------------------------------------
    if (createdProjectId) {
      console.log('🧪 [Test 7] Cleaning up: Deleting created project (must log in as Admin)...');
      // Login as Admin
      const adminLoginRes = await makeRequest('POST', '/auth/login', {
        email: 'indugula.balu@gmail.com',
        password: 'balu_2005'
      });
      const adminToken = adminLoginRes.data.token;

      const deleteRes = await makeRequest('DELETE', `/projects/${createdProjectId}`, null, adminToken);
      if (deleteRes.statusCode === 200) {
        console.log('✅ Project Cleaned/Deleted successfully!\n');
      } else {
        throw new Error(`Project cleanup failed: ${JSON.stringify(deleteRes.data)}`);
      }
    }

    console.log('==================================================');
    console.log('🎉 ALL BACKEND E2E TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FLOW FAILED:', error.message);
    process.exit(1);
  }
};

runTests();
