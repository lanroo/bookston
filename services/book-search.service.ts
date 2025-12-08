

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
        console.warn('Google Books API error:', googleResults.reason);
      }

      if (openLibraryResults.status === 'fulfilled') {
        results.push(...openLibraryResults.value);
      } else {
        console.warn('Open Library API error:', openLibraryResults.reason);
      }

      const uniqueResults = this.removeDuplicates(results);

      return uniqueResults.slice(0, maxResults);
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  }

  private static async searchGoogleBooks(query: string, maxResults: number): Promise<BookSearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=${maxResults}&langRestrict=pt`
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
      console.error('Error searching Google Books:', error);
      throw error;
    }
  }

  /**
   * Search books using Open Library API
   */
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
      console.error('Error searching Open Library:', error);
      throw error;
    }
  }

  /**
   * Map Google Books response to unified BookSearchResult
   */
  private static mapGoogleBookToResult(book: GoogleBookResponse): BookSearchResult | null {
    const volumeInfo = book.volumeInfo;
    
    // Validar que tem título (obrigatório)
    if (!volumeInfo?.title) {
      return null;
    }
    
    // Obter melhor URL de capa disponível
    const coverUrl = this.getBestCoverUrl(volumeInfo.imageLinks);
    
    // Extrair ISBN
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

  /**
   * Map Open Library response to unified BookSearchResult
   */
  private static mapOpenLibraryBookToResult(book: OpenLibraryBookResponse): BookSearchResult | null {
    // Validar que tem título (obrigatório)
    if (!book.title) {
      return null;
    }

    // Construir URL da capa do Open Library
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

  /**
   * Get the best available cover URL from Google Books imageLinks
   */
  private static getBestCoverUrl(
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      medium?: string;
      large?: string;
    }
  ): string | undefined {
    if (!imageLinks) return undefined;

    // Priorizar imagens maiores
    const url =
      imageLinks.large ||
      imageLinks.medium ||
      imageLinks.thumbnail ||
      imageLinks.smallThumbnail;

    if (!url) return undefined;

    // Converter para HTTPS e remover parâmetros de zoom
    return url.replace(/&zoom=\d+/, '').replace('http://', 'https://');
  }

  /**
   * Remove duplicate books based on title and author similarity
   */
  private static removeDuplicates(results: BookSearchResult[]): BookSearchResult[] {
    const seen = new Set<string>();
    const unique: BookSearchResult[] = [];

    for (const result of results) {
      // Validar que o resultado tem título e autores
      if (!result.title || !result.authors || result.authors.length === 0) {
        continue; // Pular resultados inválidos
      }

      // Criar chave única baseada em título e primeiro autor (normalizado)
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

  /**
   * Search books from a specific API
   * Useful for testing or when you want results from only one source
   */
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

