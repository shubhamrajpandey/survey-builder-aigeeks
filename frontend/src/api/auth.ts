import { apiClient } from './client';

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminUser;
}

export async function loginApi(credentials: { email: string; password: string }): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getMeApi(): Promise<{ admin: AdminUser }> {
  return apiClient<{ admin: AdminUser }>('/auth/me', {
    method: 'GET',
  });
}
