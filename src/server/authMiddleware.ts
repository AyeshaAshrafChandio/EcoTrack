/**
 * Backend Firebase ID Token Authentication Middleware
 * Validates Firebase ID tokens passed in Authorization: Bearer <token>
 */

import type { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

let isFirebaseAdminInitialized = false;
let adminApp: App | null = null;

// Initialize Firebase Admin if project ID or credentials are present
try {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    if (projectId && !projectId.includes('placeholder')) {
      adminApp = initializeApp({
        projectId,
      });
      isFirebaseAdminInitialized = true;
    }
  } else {
    adminApp = getApps()[0];
    isFirebaseAdminInitialized = true;
  }
} catch (err) {
  console.warn('Firebase Admin SDK initialization notice:', err);
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken | { uid: string; email?: string; name?: string };
}

export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header. Expected Bearer <Firebase_ID_Token>.',
      code: 'auth/missing-token',
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return res.status(401).json({
      error: 'Unauthorized: Empty token provided.',
      code: 'auth/empty-token',
    });
  }

  // Re-check initialization if env var was set dynamically
  if (!isFirebaseAdminInitialized || !adminApp) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    if (projectId && !projectId.includes('placeholder')) {
      try {
        adminApp = getApps().length === 0 ? initializeApp({ projectId }) : getApps()[0];
        isFirebaseAdminInitialized = true;
      } catch (e) {
        console.warn('Firebase Admin dynamic init error:', e);
      }
    }
  }

  if (!isFirebaseAdminInitialized || !adminApp) {
    return res.status(401).json({
      error: 'Unauthorized: Firebase Admin SDK requires FIREBASE_PROJECT_ID in server environment to verify ID tokens.',
      code: 'auth/admin-uninitialized',
    });
  }

  try {
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (error: any) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token.',
      code: error.code || 'auth/invalid-token',
      details: error.message,
    });
  }
}

export async function extractOptionalUser(req: Request): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1].trim();
  if (!token || !adminApp || !isFirebaseAdminInitialized) return null;
  try {
    return await getAuth(adminApp).verifyIdToken(token);
  } catch {
    return null;
  }
}

export { isFirebaseAdminInitialized };

