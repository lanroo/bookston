/**
 * Types Index
 * Single Responsibility: Central export point for all types
 * 
 * This file re-exports all types from their respective modules,
 * maintaining backward compatibility while organizing types by domain.
 */

// User & Authentication
export type {
  AuthError, AuthSession, User
} from './user';

// Books
export type {
  Book, BookStatus, BookUpdateData
} from './book';

// Notes
export type {
  Folder, Note
} from './note';

// Posts & Social
export type {
  Comment,
  CommentCreateData,
  PointsAction, PointsTransaction, Post,
  PostCreateData, UserPoints, UserProfile
} from './post';

// Database
export type {
  DatabaseBook, DatabaseComment,
  DatabaseCommentLike, DatabaseFolder, DatabaseNote, DatabasePointsTransaction, DatabasePost,
  DatabasePostLike, DatabaseUserPoints
} from './database';

// API
export type {
  ApiResponse,
  PaginatedResponse,
  ServiceError
} from './api';

// Search & Recommendations
export type {
  BookRecommendation, BookSearchResult
} from './search';

export type {
  UserPreferences
} from './recommendations';

// Common
export type {
  DragHandleProps, TabOption, ThemeMode, TouchEvent
} from './common';

