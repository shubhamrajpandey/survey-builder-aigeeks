import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

export function createApp(): Express {
  const app = express();

  // Trust proxy for accurate client IP in rate limiting & logs
  app.set('trust proxy', true);

  // Security headers
  app.use(helmet());

  // CORS configuration supporting comma-separated origin list or '*'
  const corsOrigins = env.CORS_ORIGIN.includes(',')
    ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : env.CORS_ORIGIN;

  app.use(
    cors({
      origin: corsOrigins === '*' ? true : corsOrigins,
      credentials: true,
    })
  );

  // Body parser with 100kb limit
  app.use(express.json({ limit: '100kb' }));

  // General rate limiter across all routes (skipped in test unless specifically tested)
  if (env.NODE_ENV !== 'test') {
    app.use(generalLimiter);
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API v1 routes
  app.use('/api/v1', apiRouter);

  // 404 handler for unknown routes
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested API route was not found',
      },
    });
  });

  // Central error handling middleware
  app.use(errorHandler);

  return app;
}
