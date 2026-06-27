import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/api`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [needsRole, setNeedsRole] = useState(false);

  // Watch user theme and apply corresponding styles
  useEffect(() => {
    const applyTheme = () => {
      const selectedTheme = user?.theme || 'dark';
      const root = document.documentElement;
      
      if (selectedTheme === 'light') {
        root.classList.add('light-theme');
      } else if (selectedTheme === 'dark') {
        root.classList.remove('light-theme');
      } else if (selectedTheme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.remove('light-theme');
        } else {
          root.classList.add('light-theme');
        }
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (user?.theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [user?.theme]);

  // Watch user layout density and apply
  useEffect(() => {
    const selectedDensity = user?.density || 'comfortable';
    const root = document.documentElement;
    if (selectedDensity === 'compact') {
      root.classList.add('density-compact');
    } else {
      root.classList.remove('density-compact');
    }
  }, [user?.density]);

  const updateUserLocal = (newUserData) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newUserData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper to store user data after successful auth
  const storeAuthData = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  // Helper to build user data from API response
  const buildUserData = (data) => ({
    id: data.id || data._id,
    name: data.name,
    email: data.email,
    role: data.role,
    bio: data.bio || '',
    phone: data.phone || '',
    profilePicture: data.profilePicture || '',
    profileImage: data.profileImage || '',
    authProvider: data.authProvider || 'local',
    theme: data.theme || 'dark',
    density: data.density || 'comfortable',
    publicProfile: data.publicProfile !== false,
    showContributionScore: data.showContributionScore !== false,
    showActivityTimeline: data.showActivityTimeline !== false,
    taskAlerts: data.taskAlerts !== false,
    deadlineReminders: data.deadlineReminders !== false,
    projectUpdates: data.projectUpdates !== false,
    contributionUpdates: data.contributionUpdates !== false,
    emailNotifications: !!data.emailNotifications,
    githubId: data.githubId || '',
    githubUsername: data.githubUsername || '',
    githubAvatar: data.githubAvatar || '',
    githubConnected: !!data.githubConnected,
    favoriteProjects: data.favoriteProjects || [],
    skills: data.skills || [],
    bookmarks: data.bookmarks || [],
    streakCount: data.streakCount || 0,
    dashboardConfig: data.dashboardConfig || {}
  });

  // Real API login with email/password
  const loginWithAPI = async (email, password) => {
    // Also sign in with Firebase for consistency
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (firebaseErr) {
      // Firebase sign-in may fail if user was created before Firebase integration
      // Continue with backend-only auth in that case
      console.warn('Firebase sign-in skipped:', firebaseErr.code);
    }

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    const userData = buildUserData(data.data);
    storeAuthData(userData, data.token);
    return userData;
  };

  // Google Sign-In via Firebase
  const loginWithGoogle = async () => {
    // Step 1: Firebase Google popup sign-in
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    // Step 2: Send Firebase ID token to backend
    const response = await fetch(`${API_URL}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google login failed');
    }

    const userData = buildUserData(data.data);
    storeAuthData(userData, data.token);

    // If first-time Google user, flag for role selection
    if (data.needsRole) {
      setNeedsRole(true);
    }

    return { userData, needsRole: data.needsRole };
  };

  // Complete role selection for first-time Google users
  const completeRoleSelection = async (selectedRole) => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      },
      body: JSON.stringify({ role: selectedRole })
    });

    if (response.ok) {
      const data = await response.json();
      const updatedUser = buildUserData(data.data || { ...user, role: selectedRole });
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    setNeedsRole(false);
  };

  // Real API register
  const registerWithAPI = async (name, email, password, role) => {
    // Create Firebase Auth user first
    let firebaseUid = null;
    try {
      const firebaseResult = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUid = firebaseResult.user.uid;
    } catch (firebaseErr) {
      // If Firebase user already exists, continue with backend registration
      if (firebaseErr.code !== 'auth/email-already-in-use') {
        console.warn('Firebase registration skipped:', firebaseErr.code);
      }
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, firebaseUid })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    const userData = buildUserData(data.data);
    storeAuthData(userData, data.token);
    return userData;
  };

  // Send password reset email via Backend
  const sendPasswordReset = async (email) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || 'Failed to send reset email');
      if (response.status === 404 || data.message?.includes('No account found')) {
        err.code = 'auth/user-not-found';
      }
      throw err;
    }
  };

  // Reset password via Backend using token
  const resetPassword = async (token, password) => {
    const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
  };

  // Fetch current user profile using stored JWT
  const fetchMe = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return null;

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` }
    });

    if (!response.ok) {
      logout();
      return null;
    }

    const data = await response.json();
    const userData = buildUserData(data.data);

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  // Connect Google account to existing session
  const connectGoogleWithAPI = async (idToken) => {
    const storedToken = localStorage.getItem('token') || token;
    const response = await fetch(`${API_URL}/auth/google-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google account connection failed');
    }

    const userData = buildUserData(data.data);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  // Disconnect Google account from profile
  const disconnectGoogleWithAPI = async () => {
    const storedToken = localStorage.getItem('token') || token;
    const response = await fetch(`${API_URL}/auth/google-disconnect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${storedToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google account disconnection failed');
    }

    const userData = buildUserData(data.data);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  // Trigger Firebase Google popup and send token to backend to connect
  const connectGoogleAccount = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return await connectGoogleWithAPI(idToken);
  };

  const logout = async () => {
    // Sign out of Firebase
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign-out error:', err);
    }

    setUser(null);
    setToken(null);
    setNeedsRole(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      needsRole,
      setNeedsRole,
      loginWithAPI,
      loginWithGoogle,
      completeRoleSelection,
      registerWithAPI,
      sendPasswordReset,
      resetPassword,
      fetchMe,
      updateUserLocal,
      logout,
      connectGoogleWithAPI,
      disconnectGoogleWithAPI,
      connectGoogleAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
