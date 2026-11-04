/**
 * Server-side Firebase Admin Service
 * Provides token verification and server-side authentication validation.
 */

import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

let firebaseAdminInitialized = false;

export function initFirebaseAdmin(): boolean {
  if (firebaseAdminInitialized) return true;
  if (getApps().length > 0) {
    firebaseAdminInitialized = true;
    return true;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (projectId) {
    try {
      initializeApp({
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

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken | null> {
  const initialized = initFirebaseAdmin();
  if (!initialized) return null;

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    return null;
  }
}

