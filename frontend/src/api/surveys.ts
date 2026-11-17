import { apiClient } from './client';
import { Survey, SurveyAnalyticsResponse } from '@survey/shared';

export interface SurveyWithStats {
  survey: Survey;
  responseCount: number;
}

export interface PaginatedResponsesResponse {
  responses: Array<{
    _id: string;
    surveyId: string;
    rootId: string;
    version: number;
    answers: Record<string, any>;
    submittedAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function createSurveyApi(data: Partial<Survey>): Promise<{ survey: Survey }> {
  return apiClient<{ survey: Survey }>('/surveys', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listSurveysApi(): Promise<{ surveys: SurveyWithStats[] }> {
  return apiClient<{ surveys: SurveyWithStats[] }>('/surveys', {
    method: 'GET',
  });
}

export async function getSurveyApi(rootId: string): Promise<{ survey: Survey }> {
  return apiClient<{ survey: Survey }>(`/surveys/${rootId}`, {
    method: 'GET',
  });
}

export async function updateSurveyApi(rootId: string, data: Partial<Survey>): Promise<{ survey: Survey }> {
  return apiClient<{ survey: Survey }>(`/surveys/${rootId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateSurveyStatusApi(rootId: string, status: 'published' | 'closed'): Promise<{ survey: Survey }> {
  return apiClient<{ survey: Survey }>(`/surveys/${rootId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteSurveyApi(rootId: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/surveys/${rootId}`, {
    method: 'DELETE',
  });
}

export async function getSurveyAnalyticsApi(rootId: string, version?: string): Promise<SurveyAnalyticsResponse> {
  const query = version ? `?version=${encodeURIComponent(version)}` : '';
  return apiClient<SurveyAnalyticsResponse>(`/surveys/${rootId}/analytics${query}`, {
    method: 'GET',
  });
}

export async function getSurveyResponsesApi(rootId: string, page = 1, limit = 20): Promise<PaginatedResponsesResponse> {
  return apiClient<PaginatedResponsesResponse>(`/surveys/${rootId}/responses?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
}
