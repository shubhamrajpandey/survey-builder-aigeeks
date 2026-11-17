import { Question } from './types.js';

/**
 * Evaluates whether a question is visible given the current answers and all survey questions.
 * A question depending on a hidden question is itself hidden.
 * Evaluates conditions using only answers of visible questions.
 */
export function isQuestionVisible(
  question: Question,
  answers: Record<string, any>,
  questionsById: Map<string, Question> | Record<string, Question>,
  visited: Set<string> = new Set()
): boolean {
  if (!question.condition) {
    return true;
  }

  // Prevent cycle in malformed questions
  if (visited.has(question.id)) {
    return false;
  }
  visited.add(question.id);

  const { questionId: targetId, operator, value: expectedValue } = question.condition;

  // Lookup target question
  const targetQuestion =
    questionsById instanceof Map ? questionsById.get(targetId) : questionsById[targetId];

  if (!targetQuestion) {
    return false;
  }

  // If the target question itself is not visible, this dependent question is hidden
  const isTargetVisible = isQuestionVisible(targetQuestion, answers, questionsById, visited);
  if (!isTargetVisible) {
    return false;
  }

  // Only answers of visible questions are considered
  const targetAnswer = answers[targetId];
  if (targetAnswer === undefined || targetAnswer === null) {
    return false;
  }

  // Evaluate condition operator based on target question's type
  switch (operator) {
    case 'equals': {
      if (targetQuestion.type === 'rating') {
        return Number(targetAnswer) === Number(expectedValue);
      }
      return String(targetAnswer) === String(expectedValue);
    }

    case 'not_equals': {
      if (targetQuestion.type === 'rating') {
        return Number(targetAnswer) !== Number(expectedValue);
      }
      return String(targetAnswer) !== String(expectedValue);
    }

    case 'includes': {
      if (targetQuestion.type === 'checkbox') {
        return Array.isArray(targetAnswer) && targetAnswer.includes(String(expectedValue));
      }
      return false;
    }

    case 'gt': {
      if (targetQuestion.type === 'rating') {
        const numAnswer = Number(targetAnswer);
        const numExpected = Number(expectedValue);
        return !isNaN(numAnswer) && !isNaN(numExpected) && numAnswer > numExpected;
      }
      return false;
    }

    case 'lt': {
      if (targetQuestion.type === 'rating') {
        const numAnswer = Number(targetAnswer);
        const numExpected = Number(expectedValue);
        return !isNaN(numAnswer) && !isNaN(numExpected) && numAnswer < numExpected;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Given all questions in survey order and answers, returns only the currently visible questions.
 */
export function getVisibleQuestions(
  questions: Question[],
  answers: Record<string, any>
): Question[] {
  const questionsById = new Map<string, Question>();
  for (const q of questions) {
    questionsById.set(q.id, q);
  }

  return questions.filter((q) => isQuestionVisible(q, answers, questionsById));
}
