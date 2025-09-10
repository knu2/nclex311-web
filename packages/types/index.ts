// Shared types for NCLEX311 application

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export type Environment = 'development' | 'staging' | 'production';
