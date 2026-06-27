const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

// Path to service account key file
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.join(__dirname, 'serviceAccountKey.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (err) {
  console.warn('⚠️  Firebase Admin SDK service account not found at:', serviceAccountPath);
  console.warn('   Google Sign-In will not work until you provide a valid service account.');
  serviceAccount = null;
}

if (serviceAccount && serviceAccount.project_id && serviceAccount.project_id !== 'YOUR_PROJECT_ID') {
  admin.initializeApp({
    credential: admin.cert(serviceAccount)
  });
  admin.auth = () => getAuth();
  console.log('✅ Firebase Admin SDK initialized successfully');
} else {
  console.warn('⚠️  Firebase Admin SDK not initialized — using placeholder credentials.');
  console.warn('   Replace config/serviceAccountKey.json with your real Firebase service account.');
  // Safe mock for compiling without crash
  admin.auth = () => ({
    verifyIdToken: async () => {
      throw new Error('Firebase Admin SDK is not initialized with valid service account credentials.');
    }
  });
}

module.exports = admin;
