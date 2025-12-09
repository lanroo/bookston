/**
 * User & Authentication Types
 * Single Responsibility: User and authentication related types
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

