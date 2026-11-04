import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

// Read config from Vite environment variables or fallback to empty object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key'
);

let app: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

export {
  app,
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type FirebaseUser,
};

export function formatFirebaseAuthError(error: any): string {
  if (!error) return 'An unknown error occurred during authentication.';
  const code = error.code || '';
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid institutional email address or passphrase.';
    case 'auth/email-already-in-use':
      return 'An operator account is already registered with this email.';
    case 'auth/weak-password':
      return 'Security passphrase must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid institutional email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was dismissed before completion.';
    case 'auth/network-request-failed':
      return 'Network communication failure. Please verify internet connectivity.';
    case 'auth/too-many-requests':
      return 'Too many authentication attempts. Please pause and retry shortly.';
    default:
      return error.message || 'Authentication service error occurred.';
  }
}
