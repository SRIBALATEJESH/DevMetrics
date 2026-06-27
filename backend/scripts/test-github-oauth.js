const http = require('http');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'devmetrics_jwt_secret_key_2026';
const API_URL = 'http://localhost:5000/api';

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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsedData, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runGitHubTests = async () => {
  console.log('==================================================');
  console.log('🚀 GITHUB INTEGRATION ARCHITECTURE TEST');
  console.log('==================================================\n');

  let adminToken = null;
  let devToken = null;
  let devUserId = null;
  let adminUserId = null;
  const devEmail = `dev-test-${Math.random().toString(36).substring(2, 7)}@devmetrics.com`;

  try {
    // 1. Login as Admin
    console.log('🧪 [Test 1] Logging in as Admin...');
    const adminLoginRes = await makeRequest('POST', '/auth/login', {
      email: 'balatejeshindugula@gmail.com',
      password: 'balu_2005'
    });
    if (adminLoginRes.statusCode === 200) {
      adminToken = adminLoginRes.data.token;
      adminUserId = adminLoginRes.data.data.id;
      console.log('✅ Admin login successful!\n');
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }

    // 2. Register a new Developer user
    console.log(`🧪 [Test 2] Registering dynamic Developer user: ${devEmail}...`);
    const devRegRes = await makeRequest('POST', '/auth/register', {
      name: 'Dynamic Dev',
      email: devEmail,
      password: 'password123',
      role: 'developer'
    });
    if (devRegRes.statusCode === 201) {
      devToken = devRegRes.data.token;
      devUserId = devRegRes.data.data.id;
      console.log('✅ Developer registration & session extraction successful!\n');
    } else {
      throw new Error(`Developer registration failed: ${JSON.stringify(devRegRes.data)}`);
    }

    // 3. Test GET /api/profile
    console.log('🧪 [Test 3] Testing GET /api/profile for Developer...');
    const devProfileRes = await makeRequest('GET', '/profile', null, devToken);
    if (devProfileRes.statusCode === 200 && devProfileRes.data.data.email === devEmail) {
      console.log('✅ GET /api/profile works correctly!\n');
    } else {
      throw new Error(`Profile endpoint failed: ${JSON.stringify(devProfileRes.data)}`);
    }

    // 4. Connect GitHub for Developer directly by simulating callback
    const sharedMockId = '77777';
    console.log(`🧪 [Test 4] Connecting Developer GitHub profile using mock ID ${sharedMockId}...`);
    const devStateToken = jwt.sign(
      { purpose: 'connect', userId: devUserId },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    const devCallbackPath = `/auth/github/callback?code=mock_code_fixed_${sharedMockId}&state=${devStateToken}`;
    console.log(`🧪 [Test 4b] Requesting GET ${devCallbackPath}...`);
    const devCallbackRes = await makeRequest('GET', devCallbackPath);
    
    if (devCallbackRes.statusCode === 302 && devCallbackRes.headers.location.includes('github=success')) {
      console.log('✅ Developer connected successfully!\n');
    } else {
      throw new Error(`Developer Callback failed: Status ${devCallbackRes.statusCode}, Location: ${devCallbackRes.headers.location}`);
    }

    // 5. Test GET /api/github/profile for Developer
    console.log('🧪 [Test 5] Fetching Developer GitHub details via GET /api/github/profile...');
    const devGitProfile = await makeRequest('GET', '/github/profile', null, devToken);
    if (devGitProfile.statusCode === 200 && devGitProfile.data.connected === true) {
      console.log('✅ GET /api/github/profile retrieved connected account details successfully!');
      console.log(`   Username: ${devGitProfile.data.data.username}`);
      console.log(`   GitHub ID: ${devGitProfile.data.data.githubId}\n`);
      
      if (devGitProfile.data.data.githubId !== sharedMockId) {
        throw new Error(`Expected githubId to be ${sharedMockId}, got ${devGitProfile.data.data.githubId}`);
      }

      // 6. Test GET /api/github/profile for Admin (should show disconnected / isolated)
      console.log('🧪 [Test 6] Fetching Admin GitHub profile (should be isolated & show disconnected)...');
      const adminGitProfile = await makeRequest('GET', '/github/profile', null, adminToken);
      if (adminGitProfile.statusCode === 200 && adminGitProfile.data.connected === false) {
        console.log('✅ Admin GitHub profile is isolated (not affected by Developer connection)!\n');
      } else {
        throw new Error(`Admin profile leak detected or failed: ${JSON.stringify(adminGitProfile.data)}`);
      }

      // 7. Test Duplicate Connection Block
      console.log('🧪 [Test 7] Testing duplicate mapping prevention...');
      const adminStateToken = jwt.sign(
        { purpose: 'connect', userId: adminUserId },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      // Construct callback for Admin with the SAME mock ID
      const adminCallbackPath = `/auth/github/callback?code=mock_code_fixed_${sharedMockId}&state=${adminStateToken}`;
      console.log(`🧪 [Test 7b] Trying to link the SAME GitHub account to Admin: GET ${adminCallbackPath}...`);
      const adminCallbackRes = await makeRequest('GET', adminCallbackPath);

      if (adminCallbackRes.statusCode === 302 && adminCallbackRes.headers.location.includes('github=error')) {
        const errorLocation = adminCallbackRes.headers.location;
        const errorMessage = decodeURIComponent(new URL(errorLocation).searchParams.get('message') || '');
        console.log('✅ Duplicate connection was successfully blocked by backend!');
        console.log(`   Returned Redirect URL: ${errorLocation}`);
        console.log(`   Validation Error Message: "${errorMessage}"\n`);
        
        if (!errorMessage.includes('already connected to another')) {
          throw new Error(`Unexpected validation error message: "${errorMessage}"`);
        }
      } else {
        throw new Error(`Expected duplicate linkage to be blocked, but status was ${adminCallbackRes.statusCode}, Location: ${adminCallbackRes.headers.location}`);
      }
    } else {
      throw new Error(`Developer git profile not connected: ${JSON.stringify(devGitProfile.data)}`);
    }

    // 8. Test PUT /api/github/disconnect
    console.log('🧪 [Test 8] Disconnecting Developer GitHub account via PUT /api/github/disconnect...');
    const discRes = await makeRequest('PUT', '/github/disconnect', null, devToken);
    if (discRes.statusCode === 200 && discRes.data.success === true) {
      console.log('✅ PUT /api/github/disconnect request succeeded!\n');
    } else {
      throw new Error(`PUT disconnect failed: ${JSON.stringify(discRes.data)}`);
    }

    // 9. Verify disconnection
    console.log('🧪 [Test 9] Verifying disconnection status...');
    const verifyDisc = await makeRequest('GET', '/github/profile', null, devToken);
    if (verifyDisc.statusCode === 200 && verifyDisc.data.connected === false) {
      console.log('✅ GitHub account disconnected successfully and confirmed via profile GET!\n');
    } else {
      throw new Error(`Developer still connected after disconnect command: ${JSON.stringify(verifyDisc.data)}`);
    }

    console.log('==================================================');
    console.log('🎉 ALL GITHUB ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ARCHITECTURE TEST FAILED:', error.message);
    process.exit(1);
  }
};

runGitHubTests();
