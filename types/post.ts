/**
 * Post & Social Types
 * Single Responsibility: Social features (posts, comments, points)
 */

import type { BookStatus } from './book';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userUsername?: string;
  userAvatar?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl?: string;
  bookStatus: BookStatus;
  content: string;
  rating?: number;
  hasSpoiler: boolean;
  readingProgress?: number;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostCreateData {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl?: string;
  bookStatus: BookStatus;
  content: string;
  rating?: number;
  hasSpoiler: boolean;
  readingProgress?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userUsername?: string;
  userAvatar?: string;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateData {
  postId: string;
  content: string;
}

export type PointsAction = 'post_created' | 'post_liked' | 'comment_created' | 'comment_liked';

export interface UserPoints {
  userId: string;
  totalPoints: number;
  pointsFromPosts: number;
  pointsFromLikes: number;
  pointsFromComments: number;
  level: number;
  updatedAt: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  action: PointsAction;
  relatedId: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  points?: number;
  level?: number;
}

