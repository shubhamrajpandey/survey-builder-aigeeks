import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { SurveyModel } from '../src/models/Survey.js';
import { ResponseModel } from '../src/models/Response.js';

const app = createApp();

describe('Public Survey API (/api/v1/public/surveys)', () => {
  const sampleQuestions = [
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
      label: 'Rate it (1-5)',
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
  ];

  it('GET /:rootId - returns 404 with SURVEY_DRAFT when survey is draft', async () => {
    const survey = await SurveyModel.create({
      rootId: 'survey-draft-1',
      version: 1,
      isLatest: true,
      title: 'Draft Survey',
      questions: sampleQuestions,
      status: 'draft',
    });

    const res = await request(app).get(`/api/v1/public/surveys/${survey.rootId}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('SURVEY_DRAFT');
  });

  it('GET /:rootId - returns 404 with SURVEY_CLOSED when survey is closed', async () => {
    const survey = await SurveyModel.create({
      rootId: 'survey-closed-1',
      version: 1,
      isLatest: true,
      title: 'Closed Survey',
      questions: sampleQuestions,
      status: 'closed',
    });

    const res = await request(app).get(`/api/v1/public/surveys/${survey.rootId}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('SURVEY_CLOSED');
  });

  it('GET /:rootId - returns public survey schema when published', async () => {
    const survey = await SurveyModel.create({
      rootId: 'survey-pub-1',
      version: 1,
      isLatest: true,
      title: 'Live Survey',
      description: 'Public description',
      questions: sampleQuestions,
      status: 'published',
    });

    const res = await request(app).get(`/api/v1/public/surveys/${survey.rootId}`);
    expect(res.status).toBe(200);
    expect(res.body.survey.rootId).toBe('survey-pub-1');
    expect(res.body.survey.title).toBe('Live Survey');
    expect(res.body.survey.questions.length).toBe(3);
    // Ensure admin internals are not leaked
    expect(res.body.survey._id).toBeUndefined();
    expect(res.body.survey.createdBy).toBeUndefined();
  });

  it('POST /:rootId/responses - accepts valid submission and stores cleaned answers', async () => {
    const survey = await SurveyModel.create({
      rootId: 'survey-sub-1',
      version: 1,
      isLatest: true,
      title: 'Live Survey',
      questions: sampleQuestions,
      status: 'published',
    });

    // q1 is 'Yes', q2 is required rating 5; q3 is hidden
    const res = await request(app)
      .post(`/api/v1/public/surveys/${survey.rootId}/responses`)
      .send({
        answers: {
          q1: 'Yes',
          q2: 5,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const saved = await ResponseModel.findOne({ rootId: survey.rootId });
    expect(saved).toBeDefined();
    expect(saved?.answers).toEqual({ q1: 'Yes', q2: 5 });
  });

  it('POST /:rootId/responses - rejects invalid response missing required visible field', async () => {
    const survey = await SurveyModel.create({
      rootId: 'survey-sub-2',
      version: 1,
      isLatest: true,
      title: 'Live Survey',
      questions: sampleQuestions,
      status: 'published',
    });

    // q1 = 'Yes' makes q2 visible and required, but q2 is omitted!
    const res = await request(app)
      .post(`/api/v1/public/surveys/${survey.rootId}/responses`)
      .send({
        answers: {
          q1: 'Yes',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.q2).toBe('This question is required');
  });

  it('POST /:rootId/responses - drops answers for hidden questions', async () => {
    const survey = await SurveyModel.create({
      rootId: 'survey-sub-3',
      version: 1,
      isLatest: true,
      title: 'Live Survey',
      questions: sampleQuestions,
      status: 'published',
    });

    // q1 is 'No' -> q2 is hidden, q3 is visible
    // Client supplies q2 = 5, which should be DROPPED
    const res = await request(app)
      .post(`/api/v1/public/surveys/${survey.rootId}/responses`)
      .send({
        answers: {
          q1: 'No',
          q2: 5,
          q3: 'I prefer competitor',
        },
      });

    expect(res.status).toBe(201);

    const saved = await ResponseModel.findOne({ rootId: survey.rootId });
    expect(saved?.answers.q1).toBe('No');
    expect(saved?.answers.q3).toBe('I prefer competitor');
    expect(saved?.answers.q2).toBeUndefined(); // Dropped
  });

  it('POST /:rootId/responses - honeypot field "website" silently returns 201 without storing', async () => {
    const survey = await SurveyModel.create({
      rootId: 'survey-honeypot-1',
      version: 1,
      isLatest: true,
      title: 'Live Survey',
      questions: sampleQuestions,
      status: 'published',
    });

    const res = await request(app)
      .post(`/api/v1/public/surveys/${survey.rootId}/responses`)
      .send({
        answers: { q1: 'Yes', q2: 5 },
        website: 'https://spambot.example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify nothing was saved in the database
    const saved = await ResponseModel.findOne({ rootId: survey.rootId });
    expect(saved).toBeNull();
  });

  it('POST /:rootId/responses - enforces rate limit on public submission', async () => {
    const survey = await SurveyModel.create({
      rootId: 'survey-rate-limit-1',
      version: 1,
      isLatest: true,
      title: 'Rate Limit Survey',
      questions: sampleQuestions,
      status: 'published',
    });

    // The limiter allows 10 requests per minute
    // Send 10 valid requests with a unique IP header to isolate this test
    const testIp = '198.51.100.99';
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post(`/api/v1/public/surveys/${survey.rootId}/responses`)
        .set('X-Forwarded-For', testIp)
        .send({ answers: { q1: 'Yes', q2: 5 } });
      expect(res.status).toBe(201);
    }

    // 11th request must receive 429
    const blockedRes = await request(app)
      .post(`/api/v1/public/surveys/${survey.rootId}/responses`)
      .set('X-Forwarded-For', testIp)
      .send({ answers: { q1: 'Yes', q2: 5 } });

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
