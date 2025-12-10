/**
 * Search Service
 * Unified search service for users, books, authors, and publishers
 */

import { supabase } from '@/lib/supabase';
import { BookSearchService } from '@/services/book-search.service';
import { logger } from '@/utils/logger';

export type SearchType = 'all' | 'users' | 'books' | 'authors' | 'publishers';

export interface SearchResult {
  type: 'user' | 'book' | 'author' | 'publisher';
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface SearchResults {
  users: SearchResult[];
  books: SearchResult[];
  authors: SearchResult[];
  publishers: SearchResult[];
}

export class SearchService {
  /**
   * Unified search across all content types
   */
  static async search(
    query: string,
    types: SearchType[] = ['all'],
    limit: number = 20
  ): Promise<SearchResults> {
    if (!query.trim()) {
      return {
        users: [],
        books: [],
        authors: [],
        publishers: [],
      };
    }

    const searchAll = types.includes('all');
    const searchUsers = searchAll || types.includes('users');
    const searchBooks = searchAll || types.includes('books');
    const searchAuthors = searchAll || types.includes('authors');
    const searchPublishers = searchAll || types.includes('publishers');

    try {
      const [users, books, authors, publishers] = await Promise.allSettled([
        searchUsers ? this.searchUsers(query, Math.ceil(limit / 4)) : Promise.resolve([]),
        searchBooks ? this.searchBooks(query, Math.ceil(limit / 4)) : Promise.resolve([]),
        searchAuthors ? this.searchAuthors(query, Math.ceil(limit / 4)) : Promise.resolve([]),
        searchPublishers ? this.searchPublishers(query, Math.ceil(limit / 4)) : Promise.resolve([]),
      ]);

      return {
        users: users.status === 'fulfilled' ? users.value : [],
        books: books.status === 'fulfilled' ? books.value : [],
        authors: authors.status === 'fulfilled' ? authors.value : [],
        publishers: publishers.status === 'fulfilled' ? publishers.value : [],
      };
    } catch (error) {
      logger.error('Error in unified search', error, { query, types, limit });
      throw error;
    }
  }

  /**
   * Search for users by name or username
   * Uses profiles table if available, otherwise falls back to auth metadata
   */
  private static async searchUsers(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, username, avatar_url')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(limit);

      if (!profilesError && profiles && profiles.length > 0) {
        return profiles.map((profile) => ({
          type: 'user' as const,
          id: profile.user_id,
          title: profile.name,
          subtitle: profile.username ? `@${profile.username}` : undefined,
          imageUrl: profile.avatar_url || undefined,
          metadata: {
            username: profile.username,
            isCurrentUser: profile.user_id === currentUserId,
          },
        }));
      }

      if (currentUser) {
        const name = currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || '';
        const username = currentUser.user_metadata?.username || '';
        const email = currentUser.email || '';

        if (
          name.toLowerCase().includes(query.toLowerCase()) ||
          username.toLowerCase().includes(query.toLowerCase()) ||
          email.toLowerCase().includes(query.toLowerCase())
        ) {
          return [
            {
              type: 'user' as const,
              id: currentUser.id,
              title: name,
              subtitle: username ? `@${username}` : email,
              imageUrl: currentUser.user_metadata?.avatar_url || undefined,
              metadata: {
                email,
                username,
                isCurrentUser: true,
              },
            },
          ];
        }
      }

      return [];
    } catch (error) {
      logger.error('Error searching users', error, { query, limit });
      return [];
    }
  }

  /**
   * Search for books using BookSearchService
   */
  private static async searchBooks(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const books = await BookSearchService.searchBooks(query, limit);
      return books.map((book) => ({
        type: 'book' as const,
        id: book.id || `book-${book.title}-${book.authors?.[0] || ''}`,
        title: book.title,
        subtitle: book.authors?.join(', '),
        imageUrl: book.coverUrl,
        metadata: {
          authors: book.authors,
          publisher: book.publisher,
          publishedDate: book.publishedDate,
          description: book.description,
          isbn: book.isbn,
        },
      }));
    } catch (error) {
      logger.error('Error searching books', error, { query, limit });
      return [];
    }
  }

  /**
   * Search for authors by extracting unique authors from book search results
   */
  private static async searchAuthors(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const books = await BookSearchService.searchBooks(query, limit * 2);
      const authorMap = new Map<string, { books: number; coverUrl?: string }>();

      books.forEach((book) => {
        book.authors?.forEach((author) => {
          if (author.toLowerCase().includes(query.toLowerCase())) {
            const existing = authorMap.get(author) || { books: 0 };
            authorMap.set(author, {
              books: existing.books + 1,
              coverUrl: existing.coverUrl || book.coverUrl,
            });
          }
        });
      });

      return Array.from(authorMap.entries())
        .slice(0, limit)
        .map(([author, data]) => ({
          type: 'author' as const,
          id: `author-${author}`,
          title: author,
          subtitle: `${data.books} ${data.books === 1 ? 'livro' : 'livros'}`,
          imageUrl: data.coverUrl,
          metadata: {
            bookCount: data.books,
          },
        }));
    } catch (error) {
      logger.error('Error searching authors', error, { query, limit });
      return [];
    }
  }

  /**
   * Search for publishers by extracting unique publishers from book search results
   */
  private static async searchPublishers(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const books = await BookSearchService.searchBooks(query, limit * 2);
      const publisherMap = new Map<string, { books: number; coverUrl?: string }>();

      books.forEach((book) => {
        if (book.publisher && book.publisher.toLowerCase().includes(query.toLowerCase())) {
          const existing = publisherMap.get(book.publisher) || { books: 0 };
          publisherMap.set(book.publisher, {
            books: existing.books + 1,
            coverUrl: existing.coverUrl || book.coverUrl,
          });
        }
      });

      return Array.from(publisherMap.entries())
        .slice(0, limit)
        .map(([publisher, data]) => ({
          type: 'publisher' as const,
          id: `publisher-${publisher}`,
          title: publisher,
          subtitle: `${data.books} ${data.books === 1 ? 'livro' : 'livros'}`,
          imageUrl: data.coverUrl,
          metadata: {
            bookCount: data.books,
          },
        }));
    } catch (error) {
      logger.error('Error searching publishers', error, { query, limit });
      return [];
    }
  }
}

