import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createTestAdmin } from './helpers.js';
import { SurveyModel } from '../src/models/Survey.js';
import { ResponseModel } from '../src/models/Response.js';

const app = createApp();

describe('Analytics & Responses API', () => {
  it('GET /api/v1/surveys/:rootId/analytics - returns accurate analytics for seeded dataset', async () => {
    const { authHeader } = await createTestAdmin();

    const survey = await SurveyModel.create({
      rootId: 'analytics-test-survey',
      version: 1,
      isLatest: true,
      title: 'Product Review',
      questions: [
        {
          id: 'q_choice',
          type: 'single_choice',
          label: 'Platform',
          required: true,
          options: ['Web', 'Mobile'],
        },
        {
          id: 'q_rate',
          type: 'rating',
          label: 'Satisfaction (1-5)',
          required: true,
        },
        {
          id: 'q_check',
          type: 'checkbox',
          label: 'Tools used',
          required: false,
          options: ['Analytics', 'Export', 'Sharing'],
        },
        {
          id: 'q_text',
          type: 'text',
          label: 'Notes',
          required: false,
        },
      ],
      status: 'published',
    });

    // Seed 4 specific responses
    const responses = [
      {
        surveyId: survey._id,
        rootId: survey.rootId,
        version: 1,
        answers: {
          q_choice: 'Web',
          q_rate: 5,
          q_check: ['Analytics', 'Export'],
          q_text: 'Excellent tool',
        },
        submittedAt: new Date(Date.now() - 3000),
      },
      {
        surveyId: survey._id,
        rootId: survey.rootId,
        version: 1,
        answers: {
          q_choice: 'Web',
          q_rate: 4,
          q_check: ['Analytics'],
          q_text: 'Good job',
        },
        submittedAt: new Date(Date.now() - 2000),
      },
      {
        surveyId: survey._id,
        rootId: survey.rootId,
        version: 1,
        answers: {
          q_choice: 'Mobile',
          q_rate: 3,
          q_check: ['Export', 'Sharing'],
          q_text: 'Needs mobile fix',
        },
        submittedAt: new Date(Date.now() - 1000),
      },
      {
        surveyId: survey._id,
        rootId: survey.rootId,
        version: 1,
        answers: {
          q_choice: 'Mobile',
          q_rate: 4,
          q_check: ['Sharing'],
        },
        submittedAt: new Date(),
      },
    ];

    await ResponseModel.insertMany(responses);

    const res = await request(app)
      .get(`/api/v1/surveys/${survey.rootId}/analytics`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.totalResponses).toBe(4);
    expect(res.body.version).toBe(1);

    // 1. Single Choice analytics
    const choiceQ = res.body.questions.find((q: any) => q.questionId === 'q_choice');
    expect(choiceQ.answered).toBe(4);
    expect(choiceQ.counts).toEqual([
      { option: 'Web', count: 2 },
      { option: 'Mobile', count: 2 },
    ]);

    // 2. Rating analytics: ratings = 5, 4, 3, 4 -> sum=16 / 4 = 4.0
    const ratingQ = res.body.questions.find((q: any) => q.questionId === 'q_rate');
    expect(ratingQ.answered).toBe(4);
    expect(ratingQ.average).toBe(4);
    expect(ratingQ.distribution).toEqual({
      '1': 0,
      '2': 0,
      '3': 1,
      '4': 2,
      '5': 1,
    });

    // 3. Checkbox analytics:
    // Analytics: 2, Export: 2, Sharing: 2
    const checkQ = res.body.questions.find((q: any) => q.questionId === 'q_check');
    expect(checkQ.answered).toBe(4);
    expect(checkQ.counts).toEqual([
      { option: 'Analytics', count: 2 },
      { option: 'Export', count: 2 },
      { option: 'Sharing', count: 2 },
    ]);

    // 4. Text analytics: 3 answered
    const textQ = res.body.questions.find((q: any) => q.questionId === 'q_text');
    expect(textQ.answered).toBe(3);
    expect(textQ.hasMore).toBe(false);
    expect(textQ.answers).toContain('Excellent tool');
    expect(textQ.answers).toContain('Good job');
    expect(textQ.answers).toContain('Needs mobile fix');
  });

  it('GET /api/v1/surveys/:rootId/responses - returns paginated raw responses', async () => {
    const { authHeader } = await createTestAdmin();

    const survey = await SurveyModel.create({
      rootId: 'pagination-test-survey',
      version: 1,
      isLatest: true,
      title: 'Pagination Survey',
      questions: [{ id: 'q1', type: 'text', label: 'Comment', required: false }],
      status: 'published',
    });

    // Insert 15 responses
    const docs = Array.from({ length: 15 }, (_, i) => ({
      surveyId: survey._id,
      rootId: survey.rootId,
      version: 1,
      answers: { q1: `Comment #${i + 1}` },
      submittedAt: new Date(Date.now() - (15 - i) * 1000),
    }));
    await ResponseModel.insertMany(docs);

    // Fetch page 1 with limit 10
    const page1Res = await request(app)
      .get(`/api/v1/surveys/${survey.rootId}/responses?page=1&limit=10`)
      .set('Authorization', authHeader);

    expect(page1Res.status).toBe(200);
    expect(page1Res.body.responses.length).toBe(10);
    expect(page1Res.body.pagination.total).toBe(15);
    expect(page1Res.body.pagination.page).toBe(1);
    expect(page1Res.body.pagination.totalPages).toBe(2);

    // Fetch page 2 with limit 10
    const page2Res = await request(app)
      .get(`/api/v1/surveys/${survey.rootId}/responses?page=2&limit=10`)
      .set('Authorization', authHeader);

    expect(page2Res.status).toBe(200);
    expect(page2Res.body.responses.length).toBe(5);
  });
});
