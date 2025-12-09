import { BookSearchService } from '@/services/book-search.service';
import type { BookRecommendation, BookSearchResult, UserPreferences } from '@/types';
import { BookFilterService } from './book-filter.service';
import { UserPreferencesService } from './user-preferences.service';

export class BookRecommendationsService {
  static async getRecommendations(limit: number = 20): Promise<BookRecommendation[]> {
    try {
      const preferences = await UserPreferencesService.analyzePreferences();

      if (preferences.userBooks.length === 0) {
        return this.getPopularRecommendations(limit);
      }

      const recommendations: BookRecommendation[] = [];
      const seenBookIds = new Set<string>();
      
      const userBookTitles = new Set(
        preferences.userBooks.map((book) => 
          book.title.toLowerCase().trim().replace(/\s+/g, ' ')
        )
      );
      
      const isBookInLibrary = (book: BookSearchResult): boolean => {
        const bookTitleNormalized = book.title.toLowerCase().trim().replace(/\s+/g, ' ');
        if (userBookTitles.has(bookTitleNormalized)) {
          return true;
        }
        
        if (book.authors && book.authors.length > 0) {
          const bookAuthor = book.authors[0].toLowerCase().trim();
          return preferences.userBooks.some(
            (userBook) =>
              userBook.author.toLowerCase().trim() === bookAuthor &&
              userBook.title.toLowerCase().trim().replace(/\s+/g, ' ') === bookTitleNormalized
          );
        }
        
        return false;
      };

      const authorsToSearch = new Set<string>();
      
      preferences.highlyRatedBooks.forEach((book) => {
        authorsToSearch.add(book.author);
      });
      
      preferences.recentBooks.forEach((book) => {
        authorsToSearch.add(book.author);
      });
      
      preferences.favoriteAuthors.slice(0, 3).forEach((author) => {
        authorsToSearch.add(author);
      });

      for (const author of Array.from(authorsToSearch).slice(0, 5)) {
        try {
          const results = await BookSearchService.searchBooks(author, 10);
          const filteredBooks = BookFilterService.filterBooks(results);
          
          for (const book of filteredBooks) {
            if (isBookInLibrary(book) || seenBookIds.has(book.id)) {
              continue;
            }

            const bookAuthors = (book.authors || []).map((a) => a.toLowerCase().trim());
            const searchAuthorLower = author.toLowerCase().trim();
            const isByAuthor = bookAuthors.some(
              (ba) => ba.includes(searchAuthorLower) || searchAuthorLower.includes(ba)
            );

            if (!isByAuthor) {
              continue;  
            }

            seenBookIds.add(book.id);
            recommendations.push({
              ...book,
              reason: `Outro livro de ${author}`,
              matchScore: this.calculateMatchScore(book, preferences, 'author'),
            });
          }
        } catch (error) {
          console.error(`Error searching books by author ${author}:`, error);
        }
      }

      for (const userBook of preferences.highlyRatedBooks.slice(0, 3)) {
        try {
          const titleWords = userBook.title.split(' ').filter((word) => word.length > 3).slice(0, 2);
          if (titleWords.length > 0) {
            const query = `${titleWords.join(' ')} ${userBook.author}`;
            const results = await BookSearchService.searchBooks(query, 5);
            const filteredBooks = BookFilterService.filterBooks(results);
            
            for (const book of filteredBooks) {
              if (
                isBookInLibrary(book) ||
                seenBookIds.has(book.id) ||
                book.title.toLowerCase().trim() === userBook.title.toLowerCase().trim()
              ) {
                continue;
              }

              seenBookIds.add(book.id);
              recommendations.push({
                ...book,
                reason: `Similar a "${userBook.title}"`,
                matchScore: this.calculateMatchScore(book, preferences, 'similar-book'),
              });
            }
          }
        } catch (error) {
          console.error(`Error searching similar books to ${userBook.title}:`, error);
        }
      }

      if (preferences.favoriteAuthors.length >= 2) {
        for (const { author } of preferences.readingPatterns.averageRatingByAuthor.slice(0, 2)) {
          if (authorsToSearch.has(author)) continue;

          try {
            const results = await BookSearchService.searchBooks(author, 5);
            const filteredBooks = BookFilterService.filterBooks(results);
            
            for (const book of filteredBooks) {
              if (isBookInLibrary(book) || seenBookIds.has(book.id)) {
                continue;
              }

              const bookAuthors = (book.authors || []).map((a) => a.toLowerCase().trim());
              const searchAuthorLower = author.toLowerCase().trim();
              const isByAuthor = bookAuthors.some(
                (ba) => ba.includes(searchAuthorLower) || searchAuthorLower.includes(ba)
              );

              if (!isByAuthor) {
                continue;  
              }

              seenBookIds.add(book.id);
              recommendations.push({
                ...book,
                reason: `Autor similar aos que você gosta`,
                matchScore: this.calculateMatchScore(book, preferences, 'similar-author'),
              });
            }
          } catch (error) {
            console.error(`Error searching similar author books:`, error);
          }
        }
      }

      return recommendations
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getPopularRecommendations(limit);
    }
  }

  private static async getPopularRecommendations(limit: number): Promise<BookRecommendation[]> {
    try {
      const popularQueries = [
        'best seller',
        'classic literature',
        'popular fiction',
        'award winning',
      ];

      const recommendations: BookRecommendation[] = [];
      const seenBookIds = new Set<string>();

      for (const query of popularQueries.slice(0, 2)) {
        try {
          const results = await BookSearchService.searchBooks(query, Math.ceil(limit / 2) + 5);
          const filteredBooks = BookFilterService.filterBooks(results);
          for (const book of filteredBooks) {
            if (!seenBookIds.has(book.id)) {
              seenBookIds.add(book.id);
              recommendations.push({
                ...book,
                reason: 'Livro popular e bem avaliado',
                matchScore: 0.5,  
              });
            }
          }
        } catch (error) {
          console.error(`Error searching popular books:`, error);
        }
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting popular recommendations:', error);
      return [];
    }
  }

  private static calculateMatchScore(
    book: BookSearchResult,
    preferences: UserPreferences,
    strategy: 'author' | 'similar-author' | 'similar-book'
  ): number {
    let score = 0.5;  

    if (book.authors && book.authors.length > 0) {
      const bookAuthors = book.authors.map((a) => a.toLowerCase());
      const userAuthors = preferences.userBooks.map((b) => b.author.toLowerCase());

      for (const author of bookAuthors) {
        if (userAuthors.some((ua) => author.includes(ua) || ua.includes(author))) {
          if (strategy === 'author') {
            score += 0.5;  
          } else if (strategy === 'similar-author') {
            score += 0.3;
          } else {
            score += 0.2;
          }
          break;
        }
      }
    }

    if (book.authors && book.authors.length > 0) {
      const bookAuthors = book.authors.map((a) => a.toLowerCase());
      const highlyRatedAuthors = preferences.highlyRatedBooks.map((b) => b.author.toLowerCase());
      
      if (bookAuthors.some((ba) => highlyRatedAuthors.some((hra) => ba.includes(hra) || hra.includes(ba)))) {
        score += 0.2;
      }
    }

    if (book.description && book.description.length > 100) {
      score += 0.1;
    }

    if (book.coverUrl) {
      score += 0.1;
    }

    return Math.min(score, 1.0);  
  }

  static async getSimilarBooks(bookTitle: string, author: string, limit: number = 10): Promise<BookRecommendation[]> {
    try {
      const recommendations: BookRecommendation[] = [];
      const seenBookIds = new Set<string>();

      const authorResults = await BookSearchService.searchBooks(author, limit + 5);
      const filteredAuthorResults = BookFilterService.filterBooks(authorResults);
      for (const book of filteredAuthorResults) {
        if (book.title.toLowerCase() !== bookTitle.toLowerCase() && !seenBookIds.has(book.id)) {
          seenBookIds.add(book.id);
          recommendations.push({
            ...book,
            reason: `Outro livro de ${author}`,
            matchScore: 0.8,
          });
        }
      }

      const titleWords = bookTitle.split(' ').slice(0, 2).join(' ');
      if (titleWords) {
        const similarResults = await BookSearchService.searchBooks(titleWords, Math.ceil(limit / 2) + 3);
        const filteredSimilarResults = BookFilterService.filterBooks(similarResults);
        for (const book of filteredSimilarResults) {
          if (book.title.toLowerCase() !== bookTitle.toLowerCase() && !seenBookIds.has(book.id)) {
            seenBookIds.add(book.id);
            recommendations.push({
              ...book,
              reason: 'Livro com tema similar',
              matchScore: 0.6,
            });
          }
        }
      }

      return recommendations
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting similar books:', error);
      return [];
    }
  }
}

