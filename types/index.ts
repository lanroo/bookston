
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

export interface Folder {
  id: string;
  name: string;
  userId: string;
  color?: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type BookStatus = 'want-to-read' | 'reading' | 'read' | 'rereading';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  userId: string;
  coverUrl?: string;
  rating?: number;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
    
export type ThemeMode = 'light' | 'dark';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon: string;
  badge?: number;
}

// ==================== API TYPES ====================
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

