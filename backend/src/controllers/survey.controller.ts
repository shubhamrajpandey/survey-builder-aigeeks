import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as surveyService from '../services/survey.service.js';
import * as responseService from '../services/response.service.js';
import * as analyticsService from '../services/analytics.service.js';
import { UpdateSurveyStatusSchema } from '@survey/shared';

export async function createSurvey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const survey = await surveyService.createSurvey(req.body, req.admin?.id);
    res.status(201).json({ survey });
  } catch (error) {
    next(error);
  }
}

export async function listSurveys(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const surveys = await surveyService.listSurveys();
    res.status(200).json({ surveys });
  } catch (error) {
    next(error);
  }
}

export async function getSurvey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rootId } = req.params;
    const survey = await surveyService.getSurveyByRootId(rootId);
    res.status(200).json({ survey });
  } catch (error) {
    next(error);
  }
}

export async function updateSurvey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rootId } = req.params;
    const survey = await surveyService.updateSurvey(rootId, req.body);
    res.status(200).json({ survey });
  } catch (error) {
    next(error);
  }
}

export async function updateSurveyStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rootId } = req.params;
    const { status } = UpdateSurveyStatusSchema.parse(req.body);
    const survey = await surveyService.updateSurveyStatus(rootId, status);
    res.status(200).json({ survey });
  } catch (error) {
    next(error);
  }
}

export async function deleteSurvey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rootId } = req.params;
    await surveyService.deleteSurvey(rootId);
    res.status(200).json({ success: true, message: 'Survey and all versions deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rootId } = req.params;
    const versionParam = req.query.version as string | undefined;
    const analytics = await analyticsService.getSurveyAnalytics(rootId, versionParam);
    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
}

export async function getResponses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rootId } = req.params;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const result = await responseService.getPaginatedResponses(rootId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
