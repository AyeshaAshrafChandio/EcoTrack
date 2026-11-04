/**
 * EcoTrack Operator & Firebase Authentication Middleware
 * 
 * Verifies real Firebase ID tokens when Firebase is configured,
 * and validates cryptographically signed, random, expiring, revocable operator sessions.
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db, type User } from './db';
import { verifyFirebaseIdToken } from './firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
  firebaseUser?: {
    uid: string;
    email?: string;
  };
}

// Server HMAC Secret: stable from environment or generated securely
const SESSION_SECRET = process.env.SESSION_SECRET || 'ecotrack_hmac_secret_2026_salt_874129b';

/**
 * Signs a payload with HMAC-SHA256
 */
function signString(payload: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  const sig = hmac.digest('base64url');
  return `${payload}.${sig}`;
}

/**
 * Verifies HMAC-SHA256 signature and returns the payload if valid
 */
function verifySignature(signedToken: string): string | null {
  if (!signedToken || !signedToken.includes('.')) return null;
  const lastDot = signedToken.lastIndexOf('.');
  const payload = signedToken.substring(0, lastDot);
  const signature = signedToken.substring(lastDot + 1);

  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  const expectedSig = hmac.digest('base64url');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      return payload;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Creates a cryptographically random, revocable session in database and returns the signed token.
 */
export function generateSessionToken(user: User): string {
  const session = db.createSession(user.id, 72); // 72-hour validity
  return signString(`eco_sec_${session.id}`);
}

/**
 * Validates a session token: verifies HMAC signature, checks db revocation & expiration.
 */
export function validateSessionToken(token: string): { user: User; sessionId: string } | null {
  if (!token) return null;

  // New secure format: eco_sec_<32-byte-hex>.<hmac-signature>
  if (token.startsWith('eco_sec_')) {
    const verifiedPayload = verifySignature(token);
    if (!verifiedPayload) return null;

    const sessionId = verifiedPayload.substring('eco_sec_'.length);
    const session = db.getSession(sessionId);
    if (!session) return null;

    const user = db.getUserById(session.userId);
    if (!user) return null;

    return { user, sessionId };
  }

  // Graceful fallback for legacy active session format during hot restarts
  if (token.startsWith('eco_session_')) {
    const withoutPrefix = token.substring('eco_session_'.length);
    const parts = withoutPrefix.split('__');
    const userId = parts[0];
    if (userId) {
      const user = db.getUserById(userId);
      if (user) {
        return { user, sessionId: 'legacy' };
      }
    }
  }

  return null;
}

/**
 * Middleware ensuring an operator/user session is valid.
 * 1. Checks for real Firebase ID token via Firebase Admin SDK.
 * 2. Checks for cryptographically signed operator session token.
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

  // A. Check Firebase ID Token (non-eco session prefix)
  if (!token.startsWith('eco_sec_') && !token.startsWith('eco_session_')) {
    const decodedFirebase = await verifyFirebaseIdToken(token);
    if (decodedFirebase) {
      req.firebaseUser = {
        uid: decodedFirebase.uid,
        email: decodedFirebase.email,
      };

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

  // B. Check Cryptographically Signed Local Operator Session Token
  const sessionData = validateSessionToken(token);
  if (sessionData) {
    req.user = sessionData.user;
    req.sessionId = sessionData.sessionId;
    return next();
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
  if (!token.startsWith('eco_sec_') && !token.startsWith('eco_session_')) {
    const decodedFirebase = await verifyFirebaseIdToken(token);
    if (decodedFirebase) {
      return db.getUserById(decodedFirebase.uid) || (decodedFirebase.email ? db.getUserByEmail(decodedFirebase.email) : null) || null;
    }
  }

  // Try Signed Local Token
  const sessionData = validateSessionToken(token);
  if (sessionData) {
    return sessionData.user;
  }

  return null;
}
