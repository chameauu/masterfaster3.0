/**
 * API Client for VocalAIze Backend
 * 
 * This is a mock implementation. In production, this would connect to:
 * - FastAPI backend at http://localhost:8000
 * - WebSocket for real-time voice streaming
 * - REST endpoints for chat, documents, and user management
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async register(name: string, email: string, password: string) {
    return this.post('/auth/register', { name, email, password });
  }

  // Chat endpoints
  async sendChatMessage(threadId: string, content: string) {
    return this.post(`/chat/${threadId}/messages`, { content });
  }

  async getChatThread(threadId: string) {
    return this.get(`/chat/${threadId}`);
  }

  // Document endpoints
  async getDocuments() {
    return this.get('/documents');
  }

  async searchDocuments(query: string) {
    return this.post('/documents/search', { query });
  }

  // Voice endpoints
  async transcribeAudio(audioUri: string) {
    // In production, upload audio file and get transcription
    return this.post('/voice/transcribe', { audioUri });
  }
}

export const apiClient = new APIClient(API_BASE_URL);
