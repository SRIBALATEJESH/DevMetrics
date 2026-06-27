const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

// Determine service account configuration
let serviceAccount = null;

// Option 1: Try environment variables directly (Best for Render/Vercel)
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Handle newline formatting in private key
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
}

// Option 2: Fall back to local file if environment variables are not fully set
if (!serviceAccount) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.join(__dirname, 'serviceAccountKey.json');

  try {
    serviceAccount = require(serviceAccountPath);
  } catch (err) {
    console.warn('⚠️  Firebase Admin SDK service account key file not found at:', serviceAccountPath);
    serviceAccount = null;
  }
}

// Initialize Admin SDK if serviceAccount config is resolved
if (serviceAccount && (serviceAccount.projectId || serviceAccount.project_id)) {
  try {
    const certConfig = {
      projectId: serviceAccount.projectId || serviceAccount.project_id,
      clientEmail: serviceAccount.clientEmail || serviceAccount.client_email,
      privateKey: serviceAccount.privateKey || serviceAccount.private_key
    };

    admin.initializeApp({
      credential: admin.cert(certConfig)
    });
    admin.auth = () => getAuth();
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (initErr) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', initErr.message);
    serviceAccount = null;
  }
}

if (!serviceAccount) {
  console.warn('⚠️  Firebase Admin SDK not initialized — using placeholder credentials.');
  console.warn('   Google Sign-In will not work until you configure environmental credentials or add serviceAccountKey.json.');
  // Safe mock for compiling without crash
  admin.auth = () => ({
    verifyIdToken: async () => {
      throw new Error('Firebase Admin SDK is not initialized with valid service account credentials.');
    }
  });
}

module.exports = admin;
