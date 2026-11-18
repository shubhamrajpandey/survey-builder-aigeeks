import { validateResponse, SubmitResponsePayload, Survey } from '@survey/shared';
import { SurveyModel } from '../models/Survey.js';
import { ResponseModel, IResponseDoc } from '../models/Response.js';
import { NotFoundError, BadRequestError, ValidationError } from '../utils/errors.js';
import { hashIp } from '../utils/hash.js';
import { env } from '../config/env.js';

export async function getPublicSurvey(rootId: string) {
  const survey = await SurveyModel.findOne({ rootId, isLatest: true }).lean();
  if (!survey) {
    throw new NotFoundError('Survey not found', 'SURVEY_NOT_FOUND');
  }

  if (survey.status === 'draft') {
    throw new NotFoundError('This survey is currently in draft mode and not accepting responses', 'SURVEY_DRAFT');
  }

  if (survey.status === 'closed') {
    throw new NotFoundError('This survey has been closed', 'SURVEY_CLOSED');
  }

  return {
    rootId: survey.rootId,
    version: survey.version,
    title: survey.title,
    description: survey.description || '',
    questions: survey.questions,
  };
}

export async function submitResponse(
  rootId: string,
  payload: SubmitResponsePayload,
  clientIp: string
): Promise<{ success: boolean; message: string; responseId?: string }> {
  // Honeypot check: If the hidden honeypot field is filled, silently drop and pretend success
  if (payload.website && payload.website.trim().length > 0) {
    return {
      success: true,
      message: 'Response submitted successfully',
    };
  }

  const survey = await SurveyModel.findOne({ rootId, isLatest: true });
  if (!survey) {
    throw new NotFoundError('Survey not found', 'SURVEY_NOT_FOUND');
  }

  if (survey.status !== 'published') {
    throw new BadRequestError(
      survey.status === 'closed'
        ? 'Survey is closed and no longer accepting responses'
        : 'Survey is not published',
      survey.status === 'closed' ? 'SURVEY_CLOSED' : 'SURVEY_NOT_PUBLISHED'
    );
  }

  const ipHash = hashIp(clientIp || '127.0.0.1');

  // Duplicate-spam protection (optional by env)
  if (env.SPAM_PROTECTION_ENABLED) {
    const windowStart = new Date(Date.now() - env.SPAM_WINDOW_SECONDS * 1000);
    const recent = await ResponseModel.findOne({
      rootId,
      'meta.ipHash': ipHash,
      submittedAt: { $gte: windowStart },
    });

    if (recent) {
      throw new BadRequestError(
        'Duplicate response detected. Please wait before submitting again.',
        'SPAM_DETECTED'
      );
    }
  }

  // Validate response using single source of truth in @survey/shared
  const validation = validateResponse(survey.toObject() as unknown as Survey, payload.answers || {});
  if (!validation.ok) {
    throw new ValidationError('Response validation failed', validation.errors);
  }

  const saved = await ResponseModel.create({
    surveyId: survey._id,
    rootId: survey.rootId,
    version: survey.version,
    answers: validation.cleanedAnswers,
    submittedAt: new Date(),
    meta: {
      ipHash,
    },
  });

  return {
    success: true,
    message: 'Response submitted successfully',
    responseId: saved._id.toString(),
  };
}

export async function getPaginatedResponses(
  rootId: string,
  page = 1,
  limit = 20
) {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const pageNum = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limitNum = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(100, parsedLimit) : 20;
  const skip = (pageNum - 1) * limitNum;

  const [responses, total] = await Promise.all([
    ResponseModel.find({ rootId })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-meta.ipHash')
      .lean(),
    ResponseModel.countDocuments({ rootId }),
  ]);

  return {
    responses,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}
