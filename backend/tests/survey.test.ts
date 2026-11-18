import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createTestAdmin } from './helpers.js';
import { SurveyModel } from '../src/models/Survey.js';
import { ResponseModel } from '../src/models/Response.js';

const app = createApp();

describe('Survey Admin API (/api/v1/surveys)', () => {
  const validSurveyPayload = {
    title: 'Employee Satisfaction',
    description: 'Quarterly review',
    questions: [
      {
        id: 'q1',
        type: 'single_choice',
        label: 'Are you satisfied with your work environment?',
        required: true,
        options: ['Yes', 'No'],
      },
      {
        id: 'q2',
        type: 'rating',
        label: 'Rate your satisfaction (1-5)',
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
        label: 'How can we improve?',
        required: false,
        condition: {
          questionId: 'q1',
          operator: 'equals',
          value: 'No',
        },
      },
    ],
  };

  it('POST / - creates survey with valid schema', async () => {
    const { authHeader } = await createTestAdmin();

    const res = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', authHeader)
      .send(validSurveyPayload);

    expect(res.status).toBe(201);
    expect(res.body.survey.rootId).toBeDefined();
    expect(res.body.survey.version).toBe(1);
    expect(res.body.survey.isLatest).toBe(true);
    expect(res.body.survey.status).toBe('draft');
  });

  it('POST / - rejects invalid survey schema', async () => {
    const { authHeader } = await createTestAdmin();

    // Condition references question that comes AFTER q1
    const invalidPayload = {
      title: 'Invalid Dependencies',
      questions: [
        {
          id: 'q1',
          type: 'text',
          label: 'Why?',
          required: false,
          condition: { questionId: 'q2', operator: 'equals', value: 'Yes' },
        },
        {
          id: 'q2',
          type: 'single_choice',
          label: 'Pick',
          required: true,
          options: ['Yes', 'No'],
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', authHeader)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((msg: string) => msg.includes('does not appear earlier'))).toBe(true);
  });

  it('GET / - lists latest surveys with response counts', async () => {
    const { authHeader } = await createTestAdmin();

    const createRes = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', authHeader)
      .send(validSurveyPayload);

    const rootId = createRes.body.survey.rootId;

    // Simulate 2 responses
    await ResponseModel.create({
      surveyId: createRes.body.survey._id,
      rootId,
      version: 1,
      answers: { q1: 'Yes', q2: 5 },
      submittedAt: new Date(),
    });

    const listRes = await request(app)
      .get('/api/v1/surveys')
      .set('Authorization', authHeader);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.surveys)).toBe(true);
    const item = listRes.body.surveys.find((s: { survey: { rootId: string } }) => s.survey.rootId === rootId);
    expect(item).toBeDefined();
    expect(item.responseCount).toBe(1);
  });

  it('GET /:rootId - fetches survey for editing', async () => {
    const { authHeader } = await createTestAdmin();

    const createRes = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', authHeader)
      .send(validSurveyPayload);

    const rootId = createRes.body.survey.rootId;

    const getRes = await request(app)
      .get(`/api/v1/surveys/${rootId}`)
      .set('Authorization', authHeader);

    expect(getRes.status).toBe(200);
    expect(getRes.body.survey.rootId).toBe(rootId);
    expect(getRes.body.survey.title).toBe('Employee Satisfaction');
  });

  it('PUT /:rootId - updates in-place when 0 responses exist', async () => {
    const { authHeader } = await createTestAdmin();

    const createRes = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', authHeader)
      .send(validSurveyPayload);

    const rootId = createRes.body.survey.rootId;

    const updateRes = await request(app)
      .put(`/api/v1/surveys/${rootId}`)
      .set('Authorization', authHeader)
      .send({
        title: 'Updated Satisfaction Survey',
        description: 'New description',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.survey.version).toBe(1); // Same version
    expect(updateRes.body.survey.title).toBe('Updated Satisfaction Survey');

    // Total documents with this rootId is still 1
    const count = await SurveyModel.countDocuments({ rootId });
    expect(count).toBe(1);
  });

  it('PUT /:rootId - creates NEW version when survey already has responses', async () => {
    const { authHeader } = await createTestAdmin();

    const createRes = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', authHeader)
      .send(validSurveyPayload);

    const rootId = createRes.body.survey.rootId;

    // Simulate an existing response
    await ResponseModel.create({
      surveyId: createRes.body.survey._id,
      rootId,
      version: 1,
      answers: { q1: 'Yes', q2: 4 },
      submittedAt: new Date(),
    });

    const updateRes = await request(app)
      .put(`/api/v1/surveys/${rootId}`)
      .set('Authorization', authHeader)
      .send({
        title: 'Satisfaction Survey Version 2',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.survey.version).toBe(2);
    expect(updateRes.body.survey.isLatest).toBe(true);
    expect(updateRes.body.survey.title).toBe('Satisfaction Survey Version 2');

    // Verify old version has isLatest: false
    const oldVersion = await SurveyModel.findOne({ rootId, version: 1 });
    expect(oldVersion?.isLatest).toBe(false);

    // Total version docs with this rootId is now 2
    const totalVersions = await SurveyModel.countDocuments({ rootId });
    expect(totalVersions).toBe(2);
  });

  it('PATCH /:rootId/status - updates survey status to published and closed', async () => {
    const { authHeader } = await createTestAdmin();

    const createRes = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', authHeader)
      .send(validSurveyPayload);

    const rootId = createRes.body.survey.rootId;

    const publishRes = await request(app)
      .patch(`/api/v1/surveys/${rootId}/status`)
      .set('Authorization', authHeader)
      .send({ status: 'published' });

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.survey.status).toBe('published');

    const closeRes = await request(app)
      .patch(`/api/v1/surveys/${rootId}/status`)
      .set('Authorization', authHeader)
      .send({ status: 'closed' });

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.survey.status).toBe('closed');
  });

  it('DELETE /:rootId - deletes survey and all its versions and responses', async () => {
    const { authHeader } = await createTestAdmin();

    const createRes = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', authHeader)
      .send(validSurveyPayload);

    const rootId = createRes.body.survey.rootId;

    await ResponseModel.create({
      surveyId: createRes.body.survey._id,
      rootId,
      version: 1,
      answers: { q1: 'Yes', q2: 5 },
      submittedAt: new Date(),
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/surveys/${rootId}`)
      .set('Authorization', authHeader);

    expect(deleteRes.status).toBe(200);

    const surveysLeft = await SurveyModel.countDocuments({ rootId });
    const responsesLeft = await ResponseModel.countDocuments({ rootId });
    expect(surveysLeft).toBe(0);
    expect(responsesLeft).toBe(0);
  });
});
