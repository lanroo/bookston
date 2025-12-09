/**
 * Search & Recommendations Types
 * Single Responsibility: Book search and recommendation related types
 */

export interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  coverUrl?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  source: 'google' | 'openlibrary' | 'user-library';
  isbn?: string;
}

export interface BookRecommendation extends BookSearchResult {
  reason?: string;
  score?: number;
  matchScore?: number;
}

