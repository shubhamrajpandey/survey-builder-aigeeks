import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { Admin } from '../models/Admin.js';

export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is missing or malformed');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };

    // Verify admin still exists
    const admin = await Admin.findById(decoded.id).lean();
    if (!admin) {
      throw new UnauthorizedError('Admin user no longer exists');
    }

    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
    };

    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired authentication token'));
    } else {
      next(error);
    }
  }
}
