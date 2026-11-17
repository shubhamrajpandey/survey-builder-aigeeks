import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env.js';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashIp(ip: string): string {
  return crypto.createHmac('sha256', env.IP_SALT).update(ip).digest('hex');
}
