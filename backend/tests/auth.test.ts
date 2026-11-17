import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createTestAdmin } from './helpers.js';
import { Admin } from '../src/models/Admin.js';

const app = createApp();

describe('Auth API (/api/v1/auth)', () => {
  it('POST /login - successful login returns token and admin data', async () => {
    await createTestAdmin('admin@aigeeks.io', 'ValidPassword123!');

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aigeeks.io', password: 'ValidPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.admin.email).toBe('admin@aigeeks.io');
    expect(res.body.admin.passwordHash).toBeUndefined(); // Never expose password hash
  });

  it('POST /login - fails with invalid credentials', async () => {
    await createTestAdmin('admin@aigeeks.io', 'ValidPassword123!');

    const resWrongPass = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aigeeks.io', password: 'WrongPassword' });

    expect(resWrongPass.status).toBe(401);
    expect(resWrongPass.body.error.code).toBe('INVALID_CREDENTIALS');

    const resUnknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unknown@aigeeks.io', password: 'ValidPassword123!' });

    expect(resUnknown.status).toBe(401);
    expect(resUnknown.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /me - succeeds with valid Bearer token', async () => {
    const { authHeader, admin } = await createTestAdmin('me@aigeeks.io');

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.admin.email).toBe('me@aigeeks.io');
    expect(res.body.admin.id).toBe(admin._id.toString());
  });

  it('GET /me - rejects request without token or with invalid token', async () => {
    const resNoToken = await request(app).get('/api/v1/auth/me');
    expect(resNoToken.status).toBe(401);
    expect(resNoToken.body.error.code).toBe('UNAUTHORIZED');

    const resInvalidToken = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.payload');
    expect(resInvalidToken.status).toBe(401);
    expect(resInvalidToken.body.error.code).toBe('UNAUTHORIZED');
  });
});
