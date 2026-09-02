import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'rks_property_intelligence_super_secret_jwt_key_2026';

// Pre-signed long-lived guest token for unauthenticated customers (VIEWER)
const GUEST_VIEWER_PAYLOAD: AuthUser = {
  id: 0,
  name: 'Guest Customer',
  email: 'guest@rks.com',
  role: 'VIEWER',
};

export const GUEST_TOKEN = jwt.sign(GUEST_VIEWER_PAYLOAD, JWT_SECRET, { expiresIn: '365d' });

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    return next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    return;
  }
}

/**
 * optionalAuthenticate — for public/read-only endpoints.
 * If a valid token is present, sets req.user normally.
 * If no token (or invalid), sets req.user as a VIEWER guest and continues.
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = GUEST_VIEWER_PAYLOAD;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
  } catch {
    // Invalid/expired token — fall back to guest
    req.user = GUEST_VIEWER_PAYLOAD;
  }
  return next();
}

export function requireRole(allowedRoles: ('ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' lacks permission for this action. Required: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export const authorize = requireRole;
