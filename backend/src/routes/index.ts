import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { surveyRouter } from './survey.routes.js';
import { publicRouter } from './public.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/surveys', surveyRouter);
apiRouter.use('/public', publicRouter);
