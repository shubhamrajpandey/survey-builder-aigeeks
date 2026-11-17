import { describe, it, expect } from 'vitest';
import { validateResponse } from '../src/response-validation.js';
import { Survey } from '../src/types.js';

describe('validateResponse', () => {
  const survey: Survey = {
    title: 'App Feedback',
    questions: [
      {
        id: 'q1',
        type: 'single_choice',
        label: 'Do you use our app?',
        required: true,
        options: ['Yes', 'No'],
      },
      {
        id: 'q2',
        type: 'rating',
        label: 'Rate it',
        required: true,
        condition: { questionId: 'q1', operator: 'equals', value: 'Yes' },
      },
      {
        id: 'q3',
        type: 'text',
        label: 'Why not?',
        required: true,
        condition: { questionId: 'q1', operator: 'equals', value: 'No' },
      },
      {
        id: 'q4',
        type: 'checkbox',
        label: 'Favorite features',
        required: false,
        options: ['Speed', 'UI', 'Support'],
        condition: { questionId: 'q1', operator: 'equals', value: 'Yes' },
      },
    ],
  };

  it('valid submission: { q1: "Yes", q2: 5 } -> 201; q3 is hidden so not required', () => {
    const res = validateResponse(survey, { q1: 'Yes', q2: 5 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.cleanedAnswers).toEqual({ q1: 'Yes', q2: 5 });
    }
  });

  it('missing required visible question: { q1: "Yes" } -> errors with q2 required', () => {
    const res = validateResponse(survey, { q1: 'Yes' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.q2).toBe('This question is required');
    }
  });

  it('drops hidden question answers: { q1: "No", q2: 5, q3: "Too expensive" } -> q2 dropped', () => {
    const res = validateResponse(survey, { q1: 'No', q2: 5, q3: 'Too expensive' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.cleanedAnswers).toEqual({ q1: 'No', q3: 'Too expensive' });
      expect(res.cleanedAnswers.q2).toBeUndefined();
    }
  });

  it('rejects unknown question ids in payload', () => {
    const res = validateResponse(survey, { q1: 'Yes', q2: 5, hackerField: '1337' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.hackerField).toContain("Unknown question id: 'hackerField'");
    }
  });

  it('rejects keys starting with $ or containing . (NoSQL injection guard)', () => {
    const res = validateResponse(survey, { '$where': 'malicious' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors['$where']).toBeDefined();
    }
  });

  it('validates rating bounds (1 to 5)', () => {
    const resLow = validateResponse(survey, { q1: 'Yes', q2: 0 });
    expect(resLow.ok).toBe(false);
    if (!resLow.ok) {
      expect(resLow.errors.q2).toContain('between 1 and 5');
    }

    const resHigh = validateResponse(survey, { q1: 'Yes', q2: 6 });
    expect(resHigh.ok).toBe(false);
  });

  it('validates single choice option legality', () => {
    const res = validateResponse(survey, { q1: 'Maybe', q2: 4 });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.q1).toContain('not one of the allowed choices');
    }
  });

  it('validates checkbox options and trims text', () => {
    const res = validateResponse(survey, {
      q1: 'Yes',
      q2: 5,
      q4: ['Speed', 'InvalidOption'],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.q4).toContain('invalid choices');
    }
  });
});
