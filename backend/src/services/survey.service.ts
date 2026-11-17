import crypto from 'crypto';
import { validateSurveySchema, Survey } from '@survey/shared';
import { SurveyModel, ISurveyDoc } from '../models/Survey.js';
import { ResponseModel } from '../models/Response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface SurveyWithStats {
  survey: ISurveyDoc;
  responseCount: number;
}

export async function createSurvey(
  surveyData: unknown,
  adminId?: string
): Promise<ISurveyDoc> {
  const validation = validateSurveySchema(surveyData);
  if (!validation.ok || !validation.data) {
    throw new ValidationError('Invalid survey schema', validation.errors);
  }

  const rootId = crypto.randomUUID();
  const newSurvey = await SurveyModel.create({
    rootId,
    version: 1,
    isLatest: true,
    title: validation.data.title,
    description: validation.data.description || '',
    questions: validation.data.questions,
    status: validation.data.status || 'draft',
    createdBy: adminId,
  });

  return newSurvey;
}

export async function listSurveys(): Promise<SurveyWithStats[]> {
  // Find all surveys where isLatest: true
  const latestSurveys = await SurveyModel.find({ isLatest: true })
    .sort({ createdAt: -1 })
    .lean();

  if (latestSurveys.length === 0) {
    return [];
  }

  const rootIds = latestSurveys.map((s) => s.rootId);

  // Group responses count by rootId
  const responseCounts = await ResponseModel.aggregate([
    { $match: { rootId: { $in: rootIds } } },
    { $group: { _id: '$rootId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  for (const rc of responseCounts) {
    countMap.set(rc._id, rc.count);
  }

  return latestSurveys.map((survey) => ({
    survey: survey as unknown as ISurveyDoc,
    responseCount: countMap.get(survey.rootId) || 0,
  }));
}

export async function getSurveyByRootId(rootId: string): Promise<ISurveyDoc> {
  const survey = await SurveyModel.findOne({ rootId, isLatest: true });
  if (!survey) {
    throw new NotFoundError(`Survey with id '${rootId}' not found`, 'SURVEY_NOT_FOUND');
  }
  return survey;
}

export async function updateSurvey(
  rootId: string,
  updatePayload: Partial<Survey>
): Promise<ISurveyDoc> {
  const currentSurvey = await SurveyModel.findOne({ rootId, isLatest: true });
  if (!currentSurvey) {
    throw new NotFoundError(`Survey with id '${rootId}' not found`, 'SURVEY_NOT_FOUND');
  }

  // Merge current survey with incoming payload
  const mergedCandidate = {
    title: updatePayload.title ?? currentSurvey.title,
    description: updatePayload.description ?? currentSurvey.description,
    questions: updatePayload.questions ?? currentSurvey.questions,
    status: updatePayload.status ?? currentSurvey.status,
  };

  const validation = validateSurveySchema(mergedCandidate);
  if (!validation.ok || !validation.data) {
    throw new ValidationError('Invalid survey schema', validation.errors);
  }

  // Check if any responses exist for this survey
  const existingResponsesCount = await ResponseModel.countDocuments({ rootId });

  if (existingResponsesCount === 0) {
    // 0 responses: Update survey in-place
    currentSurvey.title = validation.data.title;
    currentSurvey.description = validation.data.description || '';
    currentSurvey.questions = validation.data.questions;
    if (validation.data.status) {
      currentSurvey.status = validation.data.status;
    }
    await currentSurvey.save();
    return currentSurvey;
  } else {
    // Has responses: Versioning logic -> flip old isLatest to false, create new version doc
    currentSurvey.isLatest = false;
    await currentSurvey.save();

    const newVersion = await SurveyModel.create({
      rootId: currentSurvey.rootId,
      version: currentSurvey.version + 1,
      isLatest: true,
      title: validation.data.title,
      description: validation.data.description || '',
      questions: validation.data.questions,
      status: validation.data.status || currentSurvey.status,
      createdBy: currentSurvey.createdBy,
    });

    return newVersion;
  }
}

export async function updateSurveyStatus(
  rootId: string,
  status: 'published' | 'closed'
): Promise<ISurveyDoc> {
  const survey = await SurveyModel.findOne({ rootId, isLatest: true });
  if (!survey) {
    throw new NotFoundError(`Survey with id '${rootId}' not found`, 'SURVEY_NOT_FOUND');
  }

  survey.status = status;
  await survey.save();
  return survey;
}

export async function deleteSurvey(rootId: string): Promise<void> {
  const survey = await SurveyModel.findOne({ rootId });
  if (!survey) {
    throw new NotFoundError(`Survey with id '${rootId}' not found`, 'SURVEY_NOT_FOUND');
  }

  // Delete all versions of the survey and all corresponding responses
  await Promise.all([
    SurveyModel.deleteMany({ rootId }),
    ResponseModel.deleteMany({ rootId }),
  ]);
}
