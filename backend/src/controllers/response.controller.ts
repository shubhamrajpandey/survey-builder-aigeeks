import { Request, Response, NextFunction } from 'express';
import * as responseService from '../services/response.service.js';

export async function getPublicSurvey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rootId } = req.params;
    const survey = await responseService.getPublicSurvey(rootId);
    res.status(200).json({ survey });
  } catch (error) {
    next(error);
  }
}

export async function submitResponse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rootId } = req.params;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
    const result = await responseService.submitResponse(rootId, req.body, clientIp);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
