import { Survey, Question, AnswersMap } from './types.js';
import { isQuestionVisible } from './visibility.js';

export type ResponseValidationResult =
  | { ok: true; cleanedAnswers: AnswersMap }
  | { ok: false; errors: Record<string, string> };

/**
 * Validates survey submission answers against the survey schema and conditional logic rules:
 * - Hidden questions: required is ignored AND any submitted answer is DROPPED.
 * - Required visible questions must be answered (empty string, empty array, null/undefined = unanswered).
 * - text: string, trimmed, max 2000 chars.
 * - single_choice: string that is one of the options.
 * - checkbox: array of unique strings, each in options (required => at least 1).
 * - rating: integer 1-5.
 * - Unknown question IDs in the payload are rejected.
 * - Keys containing '.' or starting with '$' are rejected for NoSQL injection prevention.
 */
export function validateResponse(
  survey: Survey,
  rawAnswers: Record<string, any>
): ResponseValidationResult {
  const errors: Record<string, string> = {};
  const cleanedAnswers: AnswersMap = {};

  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
    return {
      ok: false,
      errors: { _general: 'Answers must be a key-value object' },
    };
  }

  const validQuestionIds = new Set(survey.questions.map((q) => q.id));
  const questionsById = new Map<string, Question>();
  for (const q of survey.questions) {
    questionsById.set(q.id, q);
  }

  // 1. Check for unknown keys and NoSQL injection attempts in answer keys
  for (const key of Object.keys(rawAnswers)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors[key] = 'Invalid characters in question key';
      continue;
    }
    if (!validQuestionIds.has(key)) {
      errors[key] = `Unknown question id: '${key}'`;
    }
  }

  // 2. Evaluate visibility and validate each question in survey order
  for (const question of survey.questions) {
    // Visibility evaluates based on cleaned answers of earlier visible questions
    const visible = isQuestionVisible(question, cleanedAnswers, questionsById);

    if (!visible) {
      // Hidden question: required is ignored, and any submitted answer is DROPPED
      continue;
    }

    const rawValue = rawAnswers[question.id];

    // Determine if question was left unanswered
    const isUnanswered =
      rawValue === undefined ||
      rawValue === null ||
      (typeof rawValue === 'string' && rawValue.trim().length === 0) ||
      (Array.isArray(rawValue) && rawValue.length === 0);

    if (isUnanswered) {
      if (question.required) {
        errors[question.id] = 'This question is required';
      }
      continue;
    }

    // Question is visible and answered -> Validate by type
    switch (question.type) {
      case 'text': {
        if (typeof rawValue !== 'string') {
          errors[question.id] = 'Answer must be a text string';
          break;
        }
        const trimmed = rawValue.trim();
        if (trimmed.length === 0 && question.required) {
          errors[question.id] = 'This question is required';
        } else if (trimmed.length > 2000) {
          errors[question.id] = 'Text response cannot exceed 2000 characters';
        } else if (trimmed.length > 0) {
          cleanedAnswers[question.id] = trimmed;
        }
        break;
      }

      case 'single_choice': {
        if (typeof rawValue !== 'string') {
          errors[question.id] = 'Answer must be a string';
          break;
        }
        const options = question.options || [];
        if (!options.includes(rawValue)) {
          errors[question.id] = `Option '${rawValue}' is not one of the allowed choices`;
        } else {
          cleanedAnswers[question.id] = rawValue;
        }
        break;
      }

      case 'checkbox': {
        if (!Array.isArray(rawValue)) {
          errors[question.id] = 'Answer must be an array of options';
          break;
        }
        const options = question.options || [];
        const uniqueSelections = Array.from(new Set(rawValue));

        // Check if any item is not in options or not string
        const hasInvalid = uniqueSelections.some(
          (item) => typeof item !== 'string' || !options.includes(item)
        );

        if (hasInvalid) {
          errors[question.id] = 'Answer contains one or more invalid choices';
        } else if (question.required && uniqueSelections.length === 0) {
          errors[question.id] = 'This question is required';
        } else if (uniqueSelections.length > 0) {
          cleanedAnswers[question.id] = uniqueSelections;
        }
        break;
      }

      case 'rating': {
        const num = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        if (!Number.isInteger(num) || num < 1 || num > 5) {
          errors[question.id] = 'Rating must be an integer between 1 and 5';
        } else {
          cleanedAnswers[question.id] = num;
        }
        break;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, cleanedAnswers };
}
