// Firebase configuration for DevMetrics (Client Web SDK)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCvkMw3YvHaAunjhs8y5Jk8gVkIPL7kXUA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "devmetrics-9d268.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "devmetrics-9d268",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "devmetrics-9d268.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "29030237583",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:29030237583:web:957c2f22163e7bde80f7fa"
};

let app;
let auth;
let googleProvider;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'  // Always show account selector
  });
} catch (err) {
  console.warn('⚠️ Firebase client initialization failed:', err.message);
}

export { auth, googleProvider };
export default app;
