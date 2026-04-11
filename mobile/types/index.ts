/**
 * Shared TypeScript types for VocalAIze Mobile
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceType: 'google_drive' | 'gmail' | 'notion' | 'local';
  date: string;
  size: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: string;
  relevance: number;
}

export interface VoiceSession {
  id: string;
  transcript: string;
  response: string;
  audioUri?: string;
  duration: number;
  createdAt: Date;
}

export interface Settings {
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  darkMode: boolean;
  voiceSpeed: number;
  voiceVolume: number;
}
