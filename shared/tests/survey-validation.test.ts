import { describe, it, expect } from 'vitest';
import { validateSurveySchema } from '../src/survey-validation.js';
import { Survey } from '../src/types.js';

describe('validateSurveySchema', () => {
  const validSurvey: Survey = {
    title: 'Customer Feedback',
    description: 'We value your opinion',
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
        label: 'Rate our app',
        required: true,
        condition: {
          questionId: 'q1',
          operator: 'equals',
          value: 'Yes',
        },
      },
      {
        id: 'q3',
        type: 'text',
        label: 'Why not?',
        required: false,
        condition: {
          questionId: 'q1',
          operator: 'equals',
          value: 'No',
        },
      },
    ],
  };

  it('accepts a valid survey schema', () => {
    const res = validateSurveySchema(validSurvey);
    expect(res.ok).toBe(true);
    expect(res.data?.title).toBe('Customer Feedback');
  });

  it('rejects an empty title', () => {
    const res = validateSurveySchema({ ...validSurvey, title: '   ' });
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes('Survey title cannot be empty'))).toBe(true);
  });

  it('rejects duplicate question IDs', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        { id: 'q1', type: 'text', label: 'Q1', required: true },
        { id: 'q1', type: 'rating', label: 'Duplicate Q1', required: false },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes("duplicate id 'q1'"))).toBe(true);
  });

  it('rejects single_choice with fewer than 2 options', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        { id: 'q1', type: 'single_choice', label: 'Pick one', required: true, options: ['Only One'] },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes('must have at least 2 options'))).toBe(true);
  });

  it('rejects single_choice with duplicate options', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        { id: 'q1', type: 'single_choice', label: 'Pick one', required: true, options: ['Yes', 'Yes'] },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes('duplicate options'))).toBe(true);
  });

  it('rejects text or rating questions with options', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        { id: 'q1', type: 'text', label: 'Feedback', required: false, options: ['Option A'] },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes('cannot have options'))).toBe(true);
  });

  it('rejects condition referencing non-existent question', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        {
          id: 'q1',
          type: 'text',
          label: 'Feedback',
          required: false,
          condition: { questionId: 'does_not_exist', operator: 'equals', value: 'Yes' },
        },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes("references non-existent question 'does_not_exist'"))).toBe(true);
  });

  it('rejects condition referencing a question that appears AFTER (forward reference / cycles)', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        {
          id: 'q1',
          type: 'text',
          label: 'Q1',
          required: false,
          condition: { questionId: 'q2', operator: 'equals', value: 'Yes' },
        },
        {
          id: 'q2',
          type: 'single_choice',
          label: 'Q2',
          required: true,
          options: ['Yes', 'No'],
        },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes('does not appear earlier'))).toBe(true);
  });

  it('rejects condition referencing itself', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        {
          id: 'q1',
          type: 'single_choice',
          label: 'Q1',
          required: true,
          options: ['Yes', 'No'],
          condition: { questionId: 'q1', operator: 'equals', value: 'Yes' },
        },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes('does not appear earlier'))).toBe(true);
  });

  it('rejects invalid operator for target question type', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        {
          id: 'q1',
          type: 'single_choice',
          label: 'Q1',
          required: true,
          options: ['Yes', 'No'],
        },
        {
          id: 'q2',
          type: 'text',
          label: 'Q2',
          required: false,
          // 'gt' is only allowed for rating
          condition: { questionId: 'q1', operator: 'gt', value: 3 },
        },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes("uses operator 'gt' which is invalid"))).toBe(true);
  });

  it('rejects condition value not present in target choice options', () => {
    const invalid = {
      ...validSurvey,
      questions: [
        {
          id: 'q1',
          type: 'single_choice',
          label: 'Q1',
          required: true,
          options: ['Yes', 'No'],
        },
        {
          id: 'q2',
          type: 'text',
          label: 'Q2',
          required: false,
          condition: { questionId: 'q1', operator: 'equals', value: 'Maybe' },
        },
      ],
    };
    const res = validateSurveySchema(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors?.some((e) => e.includes("references value 'Maybe' which is not a valid option"))).toBe(true);
  });

  it('supports checkbox with includes operator and rating with gt/lt', () => {
    const valid: Survey = {
      title: 'Advanced Survey',
      questions: [
        {
          id: 'q_cb',
          type: 'checkbox',
          label: 'Features used',
          required: true,
          options: ['Dark Mode', 'Export', 'API'],
        },
        {
          id: 'q_rate',
          type: 'rating',
          label: 'Rate API',
          required: true,
          condition: { questionId: 'q_cb', operator: 'includes', value: 'API' },
        },
        {
          id: 'q_why_low',
          type: 'text',
          label: 'Why low rating?',
          required: true,
          condition: { questionId: 'q_rate', operator: 'lt', value: 3 },
        },
      ],
    };
    const res = validateSurveySchema(valid);
    expect(res.ok).toBe(true);
  });
});
