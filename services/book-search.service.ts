

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
  source: 'google' | 'openlibrary';
  isbn?: string;
}

interface GoogleBookResponse {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      medium?: string;
      large?: string;
    };
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    language?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

interface OpenLibraryBookResponse {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  cover_edition_key?: string;
  isbn?: string[];
  language?: string[];
  subject?: string[];
  number_of_pages_median?: number;
}

interface OpenLibrarySearchResponse {
  docs: OpenLibraryBookResponse[];
}

import { logger } from '@/utils/logger';

export class BookSearchService {

  static async searchBooks(query: string, maxResults: number = 20): Promise<BookSearchResult[]> {
    if (!query.trim()) return [];

    try {
      const [googleResults, openLibraryResults] = await Promise.allSettled([
        this.searchGoogleBooks(query, Math.ceil(maxResults / 2)),
        this.searchOpenLibrary(query, Math.ceil(maxResults / 2)),
      ]);

      const results: BookSearchResult[] = [];

      if (googleResults.status === 'fulfilled') {
        results.push(...googleResults.value);
      } else {
        logger.warn('Google Books API error', { error: googleResults.reason, query });
      }

      if (openLibraryResults.status === 'fulfilled') {
        results.push(...openLibraryResults.value);
      } else {
        logger.warn('Open Library API error', { error: openLibraryResults.reason, query });
      }

      const uniqueResults = this.removeDuplicates(results);

      return uniqueResults.slice(0, maxResults);
    } catch (error) {
      logger.error('Error searching books', error, { query, maxResults });
      throw error;
    }
  }

  private static async searchGoogleBooks(query: string, maxResults: number): Promise<BookSearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=${maxResults}&langRestrict=pt&printType=books`
      );

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data = await response.json();
      const items: GoogleBookResponse[] = data.items || [];

      return items
        .map((item) => this.mapGoogleBookToResult(item))
        .filter((result): result is BookSearchResult => result !== null);
    } catch (error) {
      logger.error('Error searching Google Books', error, { query, maxResults });
      throw error;
    }
  }

  private static async searchOpenLibrary(query: string, maxResults: number): Promise<BookSearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodedQuery}&limit=${maxResults}&language=por`
      );

      if (!response.ok) {
        throw new Error(`Open Library API error: ${response.status}`);
      }

      const data: OpenLibrarySearchResponse = await response.json();
      const docs = data.docs || [];

      return docs
        .map((doc) => this.mapOpenLibraryBookToResult(doc))
        .filter((result): result is BookSearchResult => result !== null);
    } catch (error) {
      logger.error('Error searching Open Library', error, { query, maxResults });
      throw error;
    }
  }


  private static mapGoogleBookToResult(book: GoogleBookResponse): BookSearchResult | null {
    const volumeInfo = book.volumeInfo;
    
    if (!volumeInfo?.title) {
      return null;
    }

    const title = volumeInfo.title.toLowerCase();
    const description = (volumeInfo.description || '').toLowerCase();
    const categories = (volumeInfo.categories || []).join(' ').toLowerCase();
    const fullText = `${title} ${description} ${categories}`;

    const nonBookKeywords = [
      'trabalho', 'paper', 'thesis', 'dissertação', 'dissertacao', 'tese',
      'artigo', 'article', 'journal', 'revista', 'proceedings', 'conference',
      'workshop', 'abstract', 'resumo', 'monografia', 'relatório', 'relatorio',
      'report', 'manual técnico', 'manual tecnico', 'technical manual',
    ];

    for (const keyword of nonBookKeywords) {
      if (title.includes(keyword) || (description.length > 0 && description.substring(0, 200).includes(keyword))) {
        return null;  
      }
    }

    if (title.split(' ').length < 2) {
      return null;
    }
    
    const coverUrl = this.getBestCoverUrl(volumeInfo.imageLinks);
    
    const isbn = volumeInfo.industryIdentifiers?.find(
      (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier;

    return {
      id: book.id,
      title: volumeInfo.title,
      authors: volumeInfo.authors && volumeInfo.authors.length > 0 
        ? volumeInfo.authors 
        : ['Autor desconhecido'],
      description: volumeInfo.description,
      coverUrl,
      publishedDate: volumeInfo.publishedDate,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories,
      language: volumeInfo.language,
      source: 'google',
      isbn,
    };
  }

  private static mapOpenLibraryBookToResult(book: OpenLibraryBookResponse): BookSearchResult | null {
    if (!book.title) {
      return null;
    }

    const title = book.title.toLowerCase();
    const subjects = (book.subject || []).join(' ').toLowerCase();
    const fullText = `${title} ${subjects}`;

    const nonBookKeywords = [
      'trabalho', 'paper', 'thesis', 'dissertação', 'dissertacao', 'tese',
      'artigo', 'article', 'journal', 'revista', 'proceedings', 'conference',
      'workshop', 'abstract', 'resumo', 'monografia', 'relatório', 'relatorio',
      'report', 'manual técnico', 'manual tecnico', 'technical manual',
    ];

    for (const keyword of nonBookKeywords) {
      if (title.includes(keyword)) {
        return null;  
      }
    }

    if (title.split(' ').length < 2) {
      return null;
    }

    let coverUrl: string | undefined;
    if (book.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
    } else if (book.cover_edition_key) {
      coverUrl = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-L.jpg`;
    }

    return {
      id: book.key,
      title: book.title,
      authors: book.author_name && book.author_name.length > 0
        ? book.author_name
        : ['Autor desconhecido'],
      publishedDate: book.first_publish_year?.toString(),
      coverUrl,
      pageCount: book.number_of_pages_median,
      categories: book.subject?.slice(0, 5),
      language: book.language?.[0],
      source: 'openlibrary',
      isbn: book.isbn?.[0],
    };
  }

  private static getBestCoverUrl(
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      medium?: string;
      large?: string;
    }
  ): string | undefined {
    if (!imageLinks) return undefined;

    const url =
      imageLinks.large ||
      imageLinks.medium ||
      imageLinks.thumbnail ||
      imageLinks.smallThumbnail;

    if (!url) return undefined;

    return url.replace(/&zoom=\d+/, '').replace('http://', 'https://');
  }

  private static removeDuplicates(results: BookSearchResult[]): BookSearchResult[] {
    const seen = new Set<string>();
    const unique: BookSearchResult[] = [];

    for (const result of results) {
      if (!result.title || !result.authors || result.authors.length === 0) {
        continue;  
      }

      const normalizedTitle = (result.title || '').toLowerCase().trim();
      const normalizedAuthor = (result.authors[0] || '').toLowerCase().trim();
      const key = `${normalizedTitle}|${normalizedAuthor}`;

      if (!seen.has(key) && normalizedTitle) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique;
  }

  static async searchFromSource(
    source: 'google' | 'openlibrary',
    query: string,
    maxResults: number = 20
  ): Promise<BookSearchResult[]> {
    if (source === 'google') {
      return this.searchGoogleBooks(query, maxResults);
    } else {
      return this.searchOpenLibrary(query, maxResults);
    }
  }
}

