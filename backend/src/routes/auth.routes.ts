import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();

authRouter.post('/login', loginLimiter, authController.login);
authRouter.get('/me', requireAuth, authController.getMe);
