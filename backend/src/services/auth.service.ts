import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from '../models/Admin.js';
import { env } from '../config/env.js';
import { UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { comparePassword } from '../utils/hash.js';

export interface LoginResult {
  token: string;
  admin: {
    id: string;
    email: string;
    createdAt: Date;
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isMatch = await comparePassword(password, admin.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { id: admin._id.toString(), email: admin.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return {
    token,
    admin: {
      id: admin._id.toString(),
      email: admin.email,
      createdAt: admin.createdAt,
    },
  };
}

export async function getMe(adminId: string): Promise<{ id: string; email: string; createdAt: Date }> {
  const admin = await Admin.findById(adminId).lean();
  if (!admin) {
    throw new NotFoundError('Admin user not found', 'ADMIN_NOT_FOUND');
  }

  return {
    id: admin._id.toString(),
    email: admin.email,
    createdAt: admin.createdAt,
  };
}
