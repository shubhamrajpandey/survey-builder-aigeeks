import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiClientError } from '../api/client';

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('attaches Authorization Bearer header when token exists in localStorage', async () => {
    localStorage.setItem('survey_token', 'test_jwt_token_123');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
    global.fetch = mockFetch;

    await apiClient('/test-endpoint');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test_jwt_token_123');
  });

  it('handles 401 response by removing token from localStorage and throwing ApiClientError', async () => {
    localStorage.setItem('survey_token', 'expired_token');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      }),
    });
    global.fetch = mockFetch;

    await expect(apiClient('/admin/surveys')).rejects.toThrow(ApiClientError);
    // Token must have been purged from localStorage
    expect(localStorage.getItem('survey_token')).toBeNull();
  });

  it('parses standard error response details', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'Field is required' },
        },
      }),
    });
    global.fetch = mockFetch;

    try {
      await apiClient('/surveys');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details).toEqual({ field: 'Field is required' });
    }
  });
});
