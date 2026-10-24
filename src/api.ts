import { User, Survey, SurveyWithQuestions, SurveyResults, IndividualResponse, SurveyTemplate } from './types';

const TOKEN_KEY = 'pollpulse_auth_token';
const USER_KEY = 'pollpulse_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    if (isJson) {
      const errData = await response.json().catch(() => null);
      if (errData?.error) {
        errorMsg = errData.error;
      }
    } else {
      const text = await response.text().catch(() => '');
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  return isJson ? await response.json() : ((await response.text()) as unknown as T);
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  async loginDemo(role: 'demo' | 'instructor' = 'demo'): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/api/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const data = await request<{ user: User }>('/api/auth/me');
    return data.user;
  },

  logout(): void {
    clearStoredAuth();
  },

  // Surveys
  async getMySurveys(): Promise<Survey[]> {
    const data = await request<{ surveys: Survey[] }>('/api/surveys');
    return data.surveys;
  },

  async getCommunitySurveys(): Promise<Survey[]> {
    const data = await request<{ surveys: Survey[] }>('/api/surveys/all-community');
    return data.surveys;
  },

  async getSurvey(id: number): Promise<SurveyWithQuestions> {
    return await request<SurveyWithQuestions>(`/api/surveys/${id}`);
  },

  async createSurvey(payload: {
    title: string;
    description: string;
    category: string;
    questions: any[];
  }): Promise<{ surveyId: number; message: string }> {
    return await request<{ surveyId: number; message: string }>('/api/surveys', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSurvey(
    id: number,
    payload: {
      title: string;
      description: string;
      category: string;
      is_active?: boolean;
      questions?: any[];
    }
  ): Promise<{ message: string }> {
    return await request<{ message: string }>(`/api/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteSurvey(id: number): Promise<{ message: string }> {
    return await request<{ message: string }>(`/api/surveys/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleSurveyStatus(id: number): Promise<{ is_active: number; message: string }> {
    return await request<{ is_active: number; message: string }>(`/api/surveys/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  // Public survey participation
  async getPublicSurvey(id: number): Promise<{ survey: Survey; questions: any[] }> {
    return await request<{ survey: Survey; questions: any[] }>(`/api/public/surveys/${id}`);
  },

  async submitSurveyResponse(
    id: number,
    payload: {
      answers: Record<string | number, any>;
      completion_seconds: number;
      respondent_identifier?: string;
    }
  ): Promise<{ success: boolean; responseId: number; message: string }> {
    return await request<{ success: boolean; responseId: number; message: string }>(
      `/api/public/surveys/${id}/responses`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Analytics & Results
  async getSurveyResults(id: number): Promise<SurveyResults> {
    return await request<SurveyResults>(`/api/surveys/${id}/results`);
  },

  async getIndividualResponses(id: number): Promise<{ questions: any[]; responses: IndividualResponse[] }> {
    return await request<{ questions: any[]; responses: IndividualResponse[] }>(`/api/surveys/${id}/responses`);
  },

  async clearResponses(id: number): Promise<{ message: string }> {
    return await request<{ message: string }>(`/api/surveys/${id}/responses`, {
      method: 'DELETE',
    });
  },

  getExportCsvUrl(id: number): string {
    return `/api/surveys/${id}/export/csv`;
  },

  async getTemplates(): Promise<SurveyTemplate[]> {
    const data = await request<{ templates: SurveyTemplate[] }>('/api/templates');
    return data.templates;
  },
};
