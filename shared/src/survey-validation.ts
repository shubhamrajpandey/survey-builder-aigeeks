import { CreateSurveySchema } from './schemas.js';
import { Survey, Question, ConditionOperator } from './types.js';

export interface SurveyValidationResult {
  ok: boolean;
  data?: Survey;
  errors?: string[];
}

const ALLOWED_OPERATORS_BY_TYPE: Record<string, ConditionOperator[]> = {
  single_choice: ['equals', 'not_equals'],
  text: ['equals', 'not_equals'],
  checkbox: ['includes'],
  rating: ['equals', 'not_equals', 'gt', 'lt'],
};

/**
 * Validates a survey schema against structural and cross-field business rules:
 * - Title and description length limits
 * - 1 to 100 questions
 * - Unique question IDs
 * - Options valid per type (single_choice & checkbox need >= 2 unique options; text & rating must have no options)
 * - Condition references:
 *    * Must target a question that appears EARLIER in the question array (prevents cycles)
 *    * Operator must be compatible with target question's type
 *    * Value must be valid for target question (e.g., must be in its options, or 1-5 for rating)
 */
export function validateSurveySchema(input: unknown): SurveyValidationResult {
  const zodResult = CreateSurveySchema.safeParse(input);
  if (!zodResult.success) {
    const messages = zodResult.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    return { ok: false, errors: messages };
  }

  const survey = zodResult.data as Survey;
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const questionMap = new Map<string, { question: Question; index: number }>();

  survey.questions.forEach((question, index) => {
    // 1. Unique question IDs
    if (seenIds.has(question.id)) {
      errors.push(`Question at index ${index} has duplicate id '${question.id}'`);
    } else {
      seenIds.add(question.id);
      questionMap.set(question.id, { question, index });
    }

    // 2. Options validation by type
    if (question.type === 'single_choice' || question.type === 'checkbox') {
      if (!question.options || question.options.length < 2) {
        errors.push(
          `Question '${question.id}' (${question.type}) must have at least 2 options`
        );
      } else {
        const uniqueOptions = new Set(question.options.map((o) => o.trim()));
        if (uniqueOptions.size !== question.options.length) {
          errors.push(`Question '${question.id}' has duplicate options`);
        }
        for (const opt of question.options) {
          if (!opt.trim()) {
            errors.push(`Question '${question.id}' has empty option strings`);
          }
        }
      }
    } else if (question.type === 'text' || question.type === 'rating') {
      if (question.options && question.options.length > 0) {
        errors.push(`Question '${question.id}' (${question.type}) cannot have options`);
      }
    }
  });

  // 3. Condition validation (cross-question dependencies)
  survey.questions.forEach((question, index) => {
    if (!question.condition) return;

    const { questionId: targetId, operator, value } = question.condition;
    const targetEntry = questionMap.get(targetId);

    // Target must exist
    if (!targetEntry) {
      errors.push(
        `Question '${question.id}' condition references non-existent question '${targetId}'`
      );
      return;
    }

    // Target must appear EARLIER in the array (prevents cycles and forward references)
    if (targetEntry.index >= index) {
      errors.push(
        `Question '${question.id}' condition references question '${targetId}' which does not appear earlier in the survey`
      );
      return;
    }

    const targetQuestion = targetEntry.question;
    const allowedOperators = ALLOWED_OPERATORS_BY_TYPE[targetQuestion.type] || [];

    // Operator must be valid for target question type
    if (!allowedOperators.includes(operator)) {
      errors.push(
        `Condition in question '${question.id}' uses operator '${operator}' which is invalid for target question '${targetId}' of type '${targetQuestion.type}'`
      );
      return;
    }

    // Value must be valid for target question
    if (targetQuestion.type === 'single_choice' || targetQuestion.type === 'checkbox') {
      const options = targetQuestion.options || [];
      if (typeof value !== 'string' || !options.includes(value)) {
        errors.push(
          `Condition in question '${question.id}' references value '${value}' which is not a valid option of target question '${targetId}'`
        );
      }
    } else if (targetQuestion.type === 'rating') {
      const numValue = Number(value);
      if (!Number.isInteger(numValue) || numValue < 1 || numValue > 5) {
        errors.push(
          `Condition in question '${question.id}' has rating condition value '${value}' which must be an integer between 1 and 5`
        );
      }
    } else if (targetQuestion.type === 'text') {
      if (typeof value !== 'string' || value.trim().length === 0) {
        errors.push(
          `Condition in question '${question.id}' has invalid text condition value for target question '${targetId}'`
        );
      }
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: survey };
}
