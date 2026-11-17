import { describe, it, expect } from 'vitest';
import { isQuestionVisible, getVisibleQuestions } from '../src/visibility.js';
import { Question } from '../src/types.js';

describe('visibility logic', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      type: 'single_choice',
      label: 'Are you employed?',
      required: true,
      options: ['Yes', 'No'],
    },
    {
      id: 'q2',
      type: 'single_choice',
      label: 'Do you work remotely?',
      required: true,
      options: ['Yes', 'No'],
      condition: { questionId: 'q1', operator: 'equals', value: 'Yes' },
    },
    {
      id: 'q3',
      type: 'rating',
      label: 'Rate your remote work experience',
      required: true,
      condition: { questionId: 'q2', operator: 'equals', value: 'Yes' },
    },
    {
      id: 'q4',
      type: 'text',
      label: 'What could be improved?',
      required: false,
      condition: { questionId: 'q3', operator: 'lt', value: 3 },
    },
  ];

  const questionsById = new Map<string, Question>();
  for (const q of questions) {
    questionsById.set(q.id, q);
  }

  it('makes independent questions always visible', () => {
    expect(isQuestionVisible(questions[0], {}, questionsById)).toBe(true);
  });

  it('hides dependent question when parent condition is unmet or unanswered', () => {
    expect(isQuestionVisible(questions[1], {}, questionsById)).toBe(false);
    expect(isQuestionVisible(questions[1], { q1: 'No' }, questionsById)).toBe(false);
  });

  it('shows dependent question when parent condition matches', () => {
    expect(isQuestionVisible(questions[1], { q1: 'Yes' }, questionsById)).toBe(true);
  });

  it('handles dependency chain (A -> B -> C): hides C if A hides B even if C condition matches B', () => {
    // Here, q1 is "No", so q2 is hidden. Even if q2 was answered "Yes", q3 must be hidden because q2 is hidden!
    const answers = { q1: 'No', q2: 'Yes', q3: 2 };
    expect(isQuestionVisible(questions[1], answers, questionsById)).toBe(false); // q2 hidden
    expect(isQuestionVisible(questions[2], answers, questionsById)).toBe(false); // q3 hidden
    expect(isQuestionVisible(questions[3], answers, questionsById)).toBe(false); // q4 hidden
  });

  it('shows entire chain when all conditions in chain are satisfied', () => {
    const answers = { q1: 'Yes', q2: 'Yes', q3: 2 };
    expect(isQuestionVisible(questions[0], answers, questionsById)).toBe(true);
    expect(isQuestionVisible(questions[1], answers, questionsById)).toBe(true);
    expect(isQuestionVisible(questions[2], answers, questionsById)).toBe(true);
    expect(isQuestionVisible(questions[3], answers, questionsById)).toBe(true);
  });

  it('getVisibleQuestions filters correctly based on current answers', () => {
    const visibleOnlyQ1 = getVisibleQuestions(questions, { q1: 'No' });
    expect(visibleOnlyQ1.map((q) => q.id)).toEqual(['q1']);

    const visibleUpToQ2 = getVisibleQuestions(questions, { q1: 'Yes', q2: 'No' });
    expect(visibleUpToQ2.map((q) => q.id)).toEqual(['q1', 'q2']);

    const visibleUpToQ3 = getVisibleQuestions(questions, { q1: 'Yes', q2: 'Yes', q3: 5 });
    expect(visibleUpToQ3.map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);
  });

  it('supports checkbox "includes" operator', () => {
    const cbQuestions: Question[] = [
      {
        id: 'tech',
        type: 'checkbox',
        label: 'Select skills',
        required: true,
        options: ['React', 'Node.js', 'Python'],
      },
      {
        id: 'node_exp',
        type: 'text',
        label: 'Years of Node experience',
        required: true,
        condition: { questionId: 'tech', operator: 'includes', value: 'Node.js' },
      },
    ];
    const map = new Map(cbQuestions.map((q) => [q.id, q]));

    expect(isQuestionVisible(cbQuestions[1], { tech: ['React', 'Python'] }, map)).toBe(false);
    expect(isQuestionVisible(cbQuestions[1], { tech: ['React', 'Node.js'] }, map)).toBe(true);
  });
});
