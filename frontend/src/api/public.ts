import { apiClient } from './client';
import { Question, SubmitResponsePayload } from '@survey/shared';

export interface PublicSurveySchema {
  rootId: string;
  version: number;
  title: string;
  description?: string;
  questions: Question[];
}

export async function getPublicSurveyApi(rootId: string): Promise<{ survey: PublicSurveySchema }> {
  return apiClient<{ survey: PublicSurveySchema }>(`/public/surveys/${rootId}`, {
    method: 'GET',
  });
}

export async function submitPublicResponseApi(
  rootId: string,
  payload: SubmitResponsePayload
): Promise<{ success: boolean; message: string; responseId?: string }> {
  return apiClient<{ success: boolean; message: string; responseId?: string }>(
    `/public/surveys/${rootId}/responses`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}
