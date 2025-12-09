/**
 * Recommendations Types
 * Single Responsibility: User preferences and recommendation types
 */

import type { Book } from './book';

export interface UserPreferences {
  favoriteAuthors: string[];
  favoriteGenres: string[];
  averageRating: number;
  totalBooksRead: number;
  preferredStatus: string[];
  readingPatterns: {
    mostReadAuthors: Array<{ author: string; count: number }>;
    averageRatingByAuthor: Array<{ author: string; rating: number }>;
  };
  userBooks: Book[];
  highlyRatedBooks: Book[];
  recentBooks: Book[];
}

