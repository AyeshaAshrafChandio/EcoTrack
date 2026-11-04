/**
 * Server-side Firebase Admin Service
 * Provides token verification and server-side authentication validation.
 */

import admin from 'firebase-admin';

let firebaseAdminInitialized = false;

export function initFirebaseAdmin() {
  if (firebaseAdminInitialized) return true;
  if (admin.apps.length > 0) {
    firebaseAdminInitialized = true;
    return true;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (projectId) {
    try {
      admin.initializeApp({
        projectId,
      });
      firebaseAdminInitialized = true;
      console.log(`[Firebase Admin] Initialized for project ${projectId}`);
      return true;
    } catch (err: any) {
      console.warn('[Firebase Admin] Initialization notice:', err.message);
      return false;
    }
  }

  return false;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  const initialized = initFirebaseAdmin();
  if (!initialized) return null;

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    return null;
  }
}

export { admin };
