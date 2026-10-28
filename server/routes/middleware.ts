import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../db/schema';
import { db } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'aicte_portal_super_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
    name: string;
    institutionId?: string;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied: No valid Bearer token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const dbUser = db.getUserById(decoded.id);
    if (!dbUser) {
      return res.status(401).json({ error: 'User associated with token no longer exists' });
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      role: dbUser.role,
      name: dbUser.name,
      institutionId: dbUser.institutionId
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied: Role '${req.user.role}' is not authorized for this action. Required: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
}
