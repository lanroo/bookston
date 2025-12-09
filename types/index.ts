
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
  displayOrder?: number;
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

// ==================== DATABASE TYPES ====================
export interface DatabaseBook {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  user_id: string;
  cover_url: string | null;
  rating: number | null;
  notes: string | null;
  started_at: string | null;
  finished_at: string | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseNote {
  id: string;
  title: string;
  content: string | null;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseFolder {
  id: string;
  name: string;
  user_id: string;
  color: string | null;
  created_at: string;
  updated_at: string;
  notes?: Array<{ count: number }>;
}

// ==================== ERROR TYPES ====================
export interface AuthError {
  message: string;
  status?: number;
}

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

// ==================== COMPONENT TYPES ====================
import type { GestureResponderHandlers } from 'react-native';

export type DragHandleProps = Partial<GestureResponderHandlers>;

export interface TouchEvent {
  nativeEvent: {
    pageX: number;
    pageY: number;
    locationX: number;
    locationY: number;
  };
}

export interface BookUpdateData {
  title?: string;
  author?: string;
  status?: BookStatus;
  rating?: number;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  displayOrder?: number;
}

