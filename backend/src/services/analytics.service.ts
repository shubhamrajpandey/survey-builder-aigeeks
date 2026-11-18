import { SurveyAnalyticsResponse, QuestionAnalytics, Question } from '@survey/shared';
import { SurveyModel, ISurveyDoc } from '../models/Survey.js';
import { ResponseModel } from '../models/Response.js';
import { NotFoundError } from '../utils/errors.js';

export async function getSurveyAnalytics(
  rootId: string,
  versionParam?: string
): Promise<SurveyAnalyticsResponse> {
  const isAllVersions = versionParam === 'all';
  let targetSurvey: ISurveyDoc | null = null;

  if (isAllVersions) {
    targetSurvey = await SurveyModel.findOne({ rootId, isLatest: true });
  } else if (versionParam && !isNaN(Number(versionParam))) {
    targetSurvey = await SurveyModel.findOne({ rootId, version: Number(versionParam) });
  } else {
    targetSurvey = await SurveyModel.findOne({ rootId, isLatest: true });
  }

  if (!targetSurvey) {
    throw new NotFoundError(`Survey with rootId '${rootId}' not found`, 'SURVEY_NOT_FOUND');
  }

  const queryFilter: Record<string, any> = { rootId };
  if (!isAllVersions) {
    queryFilter.version = targetSurvey.version;
  }

  const [totalResponses, responses] = await Promise.all([
    ResponseModel.countDocuments(queryFilter),
    ResponseModel.find(queryFilter).sort({ submittedAt: -1 }).select('answers').lean(),
  ]);

  const questionsAnalytics: QuestionAnalytics[] = targetSurvey.questions.map((question: Question) => {
    const qId = question.id;

    switch (question.type) {
      case 'single_choice': {
        const optionCounts = new Map<string, number>();
        for (const opt of question.options || []) {
          optionCounts.set(opt, 0);
        }

        let answered = 0;
        for (const r of responses) {
          const val = r.answers?.[qId];
          if (val !== undefined && val !== null && val !== '') {
            answered++;
            const strVal = String(val);
            optionCounts.set(strVal, (optionCounts.get(strVal) || 0) + 1);
          }
        }

        return {
          questionId: qId,
          type: 'single_choice',
          label: question.label,
          answered,
          counts: (question.options || []).map((opt: string) => ({
            option: opt,
            count: optionCounts.get(opt) || 0,
          })),
        };
      }

      case 'checkbox': {
        const optionCounts = new Map<string, number>();
        for (const opt of question.options || []) {
          optionCounts.set(opt, 0);
        }

        let answered = 0;
        for (const r of responses) {
          const val = r.answers?.[qId];
          if (Array.isArray(val) && val.length > 0) {
            answered++;
            for (const item of val) {
              const strItem = String(item);
              optionCounts.set(strItem, (optionCounts.get(strItem) || 0) + 1);
            }
          }
        }

        return {
          questionId: qId,
          type: 'checkbox',
          label: question.label,
          answered,
          counts: (question.options || []).map((opt: string) => ({
            option: opt,
            count: optionCounts.get(opt) || 0,
          })),
        };
      }

      case 'rating': {
        const distribution: { '1': number; '2': number; '3': number; '4': number; '5': number } = {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
        };

        let answered = 0;
        let sum = 0;

        for (const r of responses) {
          const val = r.answers?.[qId];
          const num = Number(val);
          if (val !== undefined && val !== null && !isNaN(num) && num >= 1 && num <= 5) {
            answered++;
            sum += num;
            const key = String(num) as '1' | '2' | '3' | '4' | '5';
            distribution[key]++;
          }
        }

        const average = answered > 0 ? Math.round((sum / answered) * 100) / 100 : null;

        return {
          questionId: qId,
          type: 'rating',
          label: question.label,
          answered,
          average,
          distribution,
        };
      }

      case 'text': {
        const allTextAnswers: string[] = [];

        for (const r of responses) {
          const val = r.answers?.[qId];
          if (typeof val === 'string' && val.trim().length > 0) {
            allTextAnswers.push(val.trim());
          }
        }

        const answered = allTextAnswers.length;
        const cappedAnswers = allTextAnswers.slice(0, 200);
        const hasMore = allTextAnswers.length > 200;

        return {
          questionId: qId,
          type: 'text',
          label: question.label,
          answered,
          answers: cappedAnswers,
          hasMore,
        };
      }
    }
  });

  return {
    surveyId: targetSurvey._id.toString(),
    rootId: targetSurvey.rootId,
    version: isAllVersions ? 'all' : targetSurvey.version,
    totalResponses,
    questions: questionsAnalytics,
  };
}
