import { Admin } from '../src/models/Admin.js';
import { hashPassword } from '../src/utils/hash.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

export async function createTestAdmin(email = 'testadmin@aigeeks.io', password = 'Password123!') {
  const passwordHash = await hashPassword(password);
  const admin = await Admin.create({
    email,
    passwordHash,
  });

  const token = jwt.sign(
    { id: admin._id.toString(), email: admin.email },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    admin,
    token,
    authHeader: `Bearer ${token}`,
  };
}
