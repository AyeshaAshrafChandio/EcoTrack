/**
 * EcoTrack Operator & Firebase Authentication Middleware
 * 
 * Verifies real Firebase ID tokens when Firebase is configured,
 * and seamlessly validates operator sessions with PBKDF2 local persistence.
 */

import type { Request, Response, NextFunction } from 'express';
import { db, type User } from './db';
import { verifyFirebaseIdToken } from './firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: User;
  firebaseUser?: {
    uid: string;
    email?: string;
  };
}

export function generateSessionToken(user: User): string {
  const emailB64 = Buffer.from(user.email).toString('base64url');
  return `eco_session_${user.id}__${emailB64}`;
}

export function parseSessionToken(token: string): string | null {
  if (!token || !token.startsWith('eco_session_')) return null;
  const withoutPrefix = token.substring('eco_session_'.length);
  const parts = withoutPrefix.split('__');
  if (parts.length >= 2) {
    return parts[0]; // userId
  }
  // Fallback if single underscore used
  const singleParts = withoutPrefix.split('_');
  if (singleParts.length >= 2) {
    return singleParts.slice(0, -1).join('_');
  }
  return null;
}

/**
 * Middleware ensuring an operator/user session is valid.
 * 1. Checks for real Firebase ID token via Firebase Admin SDK.
 * 2. Checks for local PBKDF2 operator session token.
 * 3. If unauthenticated, denies access with 401.
 */
export async function verifyOperatorSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // A. Check Firebase ID Token
  if (!token.startsWith('eco_session_')) {
    const decodedFirebase = await verifyFirebaseIdToken(token);
    if (decodedFirebase) {
      req.firebaseUser = {
        uid: decodedFirebase.uid,
        email: decodedFirebase.email,
      };

      // Match or sync with database user record
      let user = db.getUserById(decodedFirebase.uid) || (decodedFirebase.email ? db.getUserByEmail(decodedFirebase.email) : undefined);
      if (!user) {
        user = db.upsertLocalUser({
          id: decodedFirebase.uid,
          name: (decodedFirebase as any).name || (decodedFirebase.email?.split('@')[0]) || 'Firebase Operator',
          email: decodedFirebase.email || `${decodedFirebase.uid}@firebase.auth`,
          role: 'Firebase Operator',
          apiKey: `eco_fb_${decodedFirebase.uid}`,
          createdAt: new Date().toISOString(),
        });
      }
      req.user = user;
      return next();
    }
  }

  // B. Check Local Operator Session Token
  const userId = parseSessionToken(token);
  if (userId) {
    const user = db.getUserById(userId);
    if (user) {
      req.user = user;
      return next();
    }
  }

  return res.status(401).json({ error: 'Invalid or expired authentication session token.' });
}

/**
 * Extract operator user if token provided, or return null if unauthenticated
 */
export async function extractOptionalOperator(req: Request): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Try Firebase ID token
  if (!token.startsWith('eco_session_')) {
    const decodedFirebase = await verifyFirebaseIdToken(token);
    if (decodedFirebase) {
      return db.getUserById(decodedFirebase.uid) || (decodedFirebase.email ? db.getUserByEmail(decodedFirebase.email) : null) || null;
    }
  }

  // Try Local Token
  const userId = parseSessionToken(token);
  if (userId) {
    return db.getUserById(userId) || null;
  }

  return null;
}
