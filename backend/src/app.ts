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

  // CORS configuration supporting comma-separated list, '*', Netlify, and Vercel domains
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isExplicitlyAllowed =
        env.CORS_ORIGIN === '*' ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin);

      const isKnownCloudPlatform =
        origin.endsWith('.netlify.app') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (isExplicitlyAllowed || isKnownCloudPlatform) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-forwarded-for'],
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

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
