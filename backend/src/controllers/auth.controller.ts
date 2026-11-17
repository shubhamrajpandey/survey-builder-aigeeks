import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';

const LoginBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = LoginBodySchema.parse(req.body);
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const admin = await authService.getMe(req.admin!.id);
    res.status(200).json({ admin });
  } catch (error) {
    next(error);
  }
}
