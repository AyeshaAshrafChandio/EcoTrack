/**
 * Backend Firebase ID Token Authentication Middleware
 *
 * Strictly verifies cryptographic Firebase ID tokens issued to authenticated clients.
 * Integrates with Firebase Admin SDK (firebase-admin/auth).
 *
 * Security Requirements:
 * - Reject any synthetic, forged, or mock tokens (local_token_*, mock_*)
 * - Verify JWT signature, issuer, expiration, and audience via Google Admin SDK
 * - Protect private user endpoints: alerts mutations, saved locations, comparisons, user profile
 */

import type { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId && !projectId.includes('placeholder') && !projectId.includes('your_')) {
    try {
      adminApp = initializeApp({ projectId });
      return adminApp;
    } catch (err) {
      console.warn('Firebase Admin SDK initialization notice:', err);
    }
  }
  return null;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Strict middleware to verify Firebase ID tokens for protected endpoints
 */
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

  // Reject insecure, synthetic, or mock tokens immediately
  if (idToken.startsWith('local_token_') || idToken.startsWith('mock_')) {
    return res.status(401).json({
      error: 'Unauthorized: Insecure synthetic tokens are strictly prohibited. A real, verified Firebase ID token is required.',
      code: 'auth/insecure-token-rejected',
    });
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    return res.status(401).json({
      error: 'Unauthorized: Firebase Admin SDK requires FIREBASE_PROJECT_ID in server environment to verify ID tokens.',
      code: 'auth/admin-uninitialized',
    });
  }

  try {
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
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

/**
 * Extract authenticated user if a valid Firebase ID token is present, otherwise return null
 */
export async function extractOptionalUser(req: Request): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1].trim();
  if (!token || token.startsWith('local_token_') || token.startsWith('mock_')) return null;

  const app = getFirebaseAdminApp();
  if (!app) return null;

  try {
    return await getAuth(app).verifyIdToken(token);
  } catch {
    return null;
  }
}

export function isFirebaseAdminInitialized(): boolean {
  return Boolean(getFirebaseAdminApp());
}
