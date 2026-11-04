/**
 * EcoTrack Firebase Authentication & Initialization Module
 * Provides real Firebase Auth integration (Email/Password, Google Sign-In, Password Reset, State Persistence)
 * Supports configuration via Vite environment variables or firebase-applet-config.json.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// 1. Gather configuration from Vite environment variables
const envConfig: FirebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Determine if real Firebase config is provided
export const isFirebaseConfigured = Boolean(
  envConfig.apiKey &&
  envConfig.apiKey !== '' &&
  !envConfig.apiKey.includes('placeholder') &&
  envConfig.projectId &&
  envConfig.projectId !== ''
);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let googleAuthProv: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(envConfig as Record<string, string>) : getApps()[0];
    firebaseAuth = getAuth(firebaseApp);
    googleAuthProv = new GoogleAuthProvider();
    googleAuthProv.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

export const auth = firebaseAuth;
export const googleProvider = googleAuthProv;

/**
 * Friendly error messages for Firebase Authentication error codes
 */
export function formatFirebaseAuthError(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';
  const message = error.message || String(error);

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please check and retry.';
    case 'auth/user-disabled':
      return 'This operator node account has been disabled. Contact system administrators.';
    case 'auth/user-not-found':
      return 'No registered account found with this email address. Please sign up first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid security passphrase. Please verify your password or use Reset Password.';
    case 'auth/email-already-in-use':
      return 'An operator node with this institutional email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Security passphrase is too weak. Please use at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before completion.';
    case 'auth/cancelled-popup-request':
      return 'Another authentication popup is already active.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this domain.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email under a different sign-in provider.';
    case 'auth/network-request-failed':
      return 'Network communication failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to multiple failed attempts. Please try again later.';
    default:
      if (!isFirebaseConfigured) {
        return 'Firebase Authentication is not yet configured. Please configure VITE_FIREBASE_* in .env or Firebase Console.';
      }
      return message.replace('Firebase: ', '').replace(` (${code})`, '');
  }
}

/**
 * Real Firebase Email/Password Sign-Up
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<UserCredential> {
  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not configured. Please supply VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.');
  }
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  if (displayName && cred.user) {
    try {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn('Could not set displayName on new user profile:', e);
    }
  }
  return cred;
}

/**
 * Real Firebase Email/Password Sign-In
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserCredential> {
  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not configured. Please supply VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.');
  }
  return await signInWithEmailAndPassword(firebaseAuth, email.trim(), pass);
}

/**
 * Real Firebase Google Sign-In via Popup
 */
export async function loginWithGoogle(): Promise<UserCredential> {
  if (!firebaseAuth || !googleAuthProv) {
    throw new Error('Firebase Authentication or Google provider is not configured. Please supply VITE_FIREBASE_API_KEY and enable Google in Firebase Console.');
  }
  return await signInWithPopup(firebaseAuth, googleAuthProv);
}

/**
 * Real Firebase Password Reset Email
 */
export async function resetUserPassword(email: string): Promise<void> {
  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not configured. Please supply VITE_FIREBASE_API_KEY in .env.');
  }
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}

/**
 * Real Firebase Logout
 */
export async function logoutUser(): Promise<void> {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}

/**
 * Fetch current Firebase ID Token for backend verification
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  if (!firebaseAuth || !firebaseAuth.currentUser) return null;
  return await firebaseAuth.currentUser.getIdToken(false);
}

export { onAuthStateChanged, type User };
