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

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Check demo header for seamless UI role testing
  const overrideRole = req.headers['x-demo-role'] as string | undefined;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      if (overrideRole && ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'].includes(overrideRole)) {
        decoded.role = overrideRole as any;
      }
      req.user = decoded;
      return next();
    } catch (err) {
      // Invalid token, fall through to fallback demo user if in local dev
    }
  }

  // Local development / demo fallback user
  req.user = {
    id: 1,
    name: 'Rajesh Kumar S (Director)',
    email: 'admin@rks.com',
    role: (overrideRole && ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'].includes(overrideRole))
      ? (overrideRole as any)
      : 'ADMIN',
  };

  next();
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
