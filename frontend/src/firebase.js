// Firebase configuration for DevMetrics
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCvkMw3YvHaAunjhs8y5Jk8gVkIPL7kXUA",
  authDomain: "devmetrics-9d268.firebaseapp.com",
  projectId: "devmetrics-9d268",
  storageBucket: "devmetrics-9d268.firebasestorage.app",
  messagingSenderId: "29030237583",
  appId: "1:29030237583:web:957c2f22163e7bde80f7fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'  // Always show account selector
});

export { auth, googleProvider };
export default app;
