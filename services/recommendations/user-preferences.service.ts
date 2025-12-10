import { BooksService } from '@/services/books.service';
import type { UserPreferences } from '@/types';
import { logger } from '@/utils/logger';

export class UserPreferencesService {
  static async analyzePreferences(): Promise<UserPreferences> {
    try {
      const allBooks = await BooksService.getBooks();
      
 
      if (!Array.isArray(allBooks)) {
        throw new Error('BooksService.getBooks() did not return an array');
      }

      const validBooks = allBooks.filter(
        (book) =>
          book &&
          typeof book === 'object' &&
          book.id &&
          book.title &&
          book.author &&
          book.status &&
          book.createdAt
      );

      const readBooks = validBooks.filter((book) => book.status === 'read');
      const ratedBooks = readBooks.filter(
        (book) => book.rating !== undefined && book.rating !== null && typeof book.rating === 'number' && book.rating > 0
      );
      
      const highlyRatedBooks = ratedBooks.filter((book) => book.rating! >= 4);
      
      const recentBooks = [...validBooks]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();

          if (isNaN(dateA) || isNaN(dateB)) {
            return isNaN(dateA) ? 1 : -1;
          }
          return dateB - dateA;
        })
        .slice(0, 10);

      const authorCounts = new Map<string, number>();
      readBooks.forEach((book) => {
        if (book.author && typeof book.author === 'string' && book.author.trim()) {
          const author = book.author.trim();
          const count = authorCounts.get(author) || 0;
          authorCounts.set(author, count + 1);
        }
      });

      const favoriteAuthors = Array.from(authorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([author]) => author);

      const totalRating = ratedBooks.reduce((sum, book) => {
        const rating = book.rating;
        if (typeof rating === 'number' && rating > 0) {
          return sum + rating;
        }
        return sum;
      }, 0);
      const averageRating = ratedBooks.length > 0 ? totalRating / ratedBooks.length : 0;

      const statusCounts = new Map<string, number>();
      validBooks.forEach((book) => {
        if (book.status && typeof book.status === 'string') {
          const count = statusCounts.get(book.status) || 0;
          statusCounts.set(book.status, count + 1);
        }
      });

      const preferredStatus = Array.from(statusCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([status]) => status);

      const mostReadAuthors = Array.from(authorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([author, count]) => ({ author, count }));

      const authorRatings = new Map<string, { total: number; count: number }>();
      ratedBooks.forEach((book) => {
        if (book.author && typeof book.author === 'string' && book.author.trim() && book.rating) {
          const author = book.author.trim();
          const rating = book.rating;
          if (typeof rating === 'number' && rating > 0) {
            const existing = authorRatings.get(author) || { total: 0, count: 0 };
            authorRatings.set(author, {
              total: existing.total + rating,
              count: existing.count + 1,
            });
          }
        }
      });

      const averageRatingByAuthor = Array.from(authorRatings.entries())
        .map(([author, data]) => ({
          author,
          rating: data.total / data.count,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      return {
        favoriteAuthors,
        favoriteGenres: [],  
        averageRating,
        totalBooksRead: readBooks.length,
        preferredStatus,
        readingPatterns: {
          mostReadAuthors,
          averageRatingByAuthor,
        },
        userBooks: validBooks,
        highlyRatedBooks,
        recentBooks,
      };
    } catch (error) {
      logger.error('Error analyzing user preferences', error);
      return {
        favoriteAuthors: [],
        favoriteGenres: [],
        averageRating: 0,
        totalBooksRead: 0,
        preferredStatus: [],
        readingPatterns: {
          mostReadAuthors: [],
          averageRatingByAuthor: [],
        },
        userBooks: [],
        highlyRatedBooks: [],
        recentBooks: [],
      };
    }
  }

  static async getSearchKeywords(): Promise<string[]> {
    try {
      const preferences = await this.analyzePreferences();
      const keywords: string[] = [];

      keywords.push(...preferences.favoriteAuthors.slice(0, 5));

      preferences.readingPatterns.averageRatingByAuthor
        .filter((item) => item.rating >= 4)
        .forEach((item) => {
          if (!keywords.includes(item.author)) {
            keywords.push(item.author);
          }
        });

      return keywords;
    } catch (error) {
      logger.error('Error getting search keywords', error);
      return [];
    }
  }
}

