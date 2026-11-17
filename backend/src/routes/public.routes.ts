import { Router } from 'express';
import * as responseController from '../controllers/response.controller.js';
import { submitLimiter } from '../middleware/rateLimiter.js';

export const publicRouter = Router();

publicRouter.get('/surveys/:rootId', responseController.getPublicSurvey);
publicRouter.post('/surveys/:rootId/responses', submitLimiter, responseController.submitResponse);
