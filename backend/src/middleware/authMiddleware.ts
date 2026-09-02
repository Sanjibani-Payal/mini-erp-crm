import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing or invalid' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'mini_erp_crm_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired authentication token' });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden. Role '${req.user.role}' does not have permission to perform this action. Required: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};
