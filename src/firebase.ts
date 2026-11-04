import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

// Read config from firebase-applet-config.json or Vite environment variables
const firebaseConfig = {
  apiKey: appletConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: appletConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: appletConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: appletConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: appletConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: appletConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key'
);

let app: any = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    if (appletConfig?.firestoreDatabaseId) {
      db = getFirestore(app, appletConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

export {
  app,
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
      return 'Google sign-in popup was dismissed before completion. Please try again.';
    case 'auth/popup-blocked':
      return 'Browser blocked the Google sign-in popup window. Please allow popups for this site or retry with redirect.';
    case 'auth/cancelled-popup-request':
      return 'Previous sign-in request was cancelled. Please try again.';
    case 'auth/unauthorized-domain':
      return `This domain (${typeof window !== 'undefined' ? window.location.hostname : 'current domain'}) is not authorized in Firebase. Please ensure it is in Authorized Domains.`;
    case 'auth/network-request-failed':
      return 'Network communication failure. Please verify internet connectivity.';
    case 'auth/too-many-requests':
      return 'Too many authentication attempts. Please pause and retry shortly.';
    default:
      return error.message || 'Authentication service error occurred.';
  }
}
