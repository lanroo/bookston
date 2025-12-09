/**
 * Database Types
 * Single Responsibility: Database schema types (snake_case)
 */

import type { BookStatus } from './book';
import type { PointsAction } from './post';

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

export interface DatabasePost {
  id: string;
  user_id: string;
  book_id: string;
  book_title: string;
  book_author: string;
  book_cover_url: string | null;
  book_status: BookStatus;
  content: string;
  rating: number | null;
  has_spoiler: boolean;
  reading_progress: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface DatabasePostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface DatabaseComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface DatabaseUserPoints {
  user_id: string;
  total_points: number;
  points_from_posts: number;
  points_from_likes: number;
  points_from_comments: number;
  level: number;
  updated_at: string;
}

export interface DatabasePointsTransaction {
  id: string;
  user_id: string;
  points: number;
  action: PointsAction;
  related_id: string;
  created_at: string;
}

