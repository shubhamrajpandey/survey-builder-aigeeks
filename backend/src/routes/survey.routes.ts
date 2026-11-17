import { Router } from 'express';
import * as surveyController from '../controllers/survey.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const surveyRouter = Router();

// All survey admin routes require authentication
surveyRouter.use(requireAuth);

surveyRouter.post('/', surveyController.createSurvey);
surveyRouter.get('/', surveyController.listSurveys);
surveyRouter.get('/:rootId', surveyController.getSurvey);
surveyRouter.put('/:rootId', surveyController.updateSurvey);
surveyRouter.patch('/:rootId/status', surveyController.updateSurveyStatus);
surveyRouter.delete('/:rootId', surveyController.deleteSurvey);
surveyRouter.get('/:rootId/analytics', surveyController.getAnalytics);
surveyRouter.get('/:rootId/responses', surveyController.getResponses);
