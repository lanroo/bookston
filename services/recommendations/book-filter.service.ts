
export class BookFilterService {
  private static readonly NON_BOOK_KEYWORDS = [
    'trabalho',
    'paper',
    'thesis',
    'dissertação',
    'dissertacao',
    'tese',
    'artigo',
    'article',
    'journal',
    'revista',
    'proceedings',
    'conference',
    'workshop',
    'abstract',
    'resumo',
    'monografia',
    'relatório',
    'relatorio',
    'report',
    'manual técnico',
    'manual tecnico',
    'technical manual',
    'guia rápido',
    'quick guide',
    'folheto',
    'pamphlet',
    'brochura',
    'catálogo',
    'catalogo',
    'catalog',
  ];

  private static readonly BOOK_KEYWORDS = [
    'romance',
    'novel',
    'ficção',
    'ficcao',
    'fiction',
    'história',
    'historia',
    'history',
    'biografia',
    'biography',
    'autobiografia',
    'autobiography',
    'poesia',
    'poetry',
    'poema',
    'poem',
    'contos',
    'short stories',
    'crônicas',
    'cronicas',
    'chronicles',
    'ensaio',
    'essay',
    'livro',
    'book',
  ];


  static isBook(result: { title: string; description?: string; categories?: string[] }): boolean {
    const title = (result.title || '').toLowerCase();
    const description = (result.description || '').toLowerCase();
    const categories = (result.categories || []).join(' ').toLowerCase();

    const fullText = `${title} ${description} ${categories}`;

    for (const keyword of this.NON_BOOK_KEYWORDS) {
      if (fullText.includes(keyword.toLowerCase())) {
        if (this.isStrongNonBookIndicator(keyword, title, description)) {
          return false;
        }
      }
    }

    for (const keyword of this.BOOK_KEYWORDS) {
      if (fullText.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    if (title.split(' ').length < 2) {
      return false;
    }

    if (this.looksLikePaperOrThesis(title)) {
      return false;
    }

    return true;
  }

  private static isStrongNonBookIndicator(
    keyword: string,
    title: string,
    description: string
  ): boolean {
    const strongIndicators = ['trabalho', 'paper', 'thesis', 'dissertação', 'dissertacao', 'tese', 'artigo', 'article'];
    
    if (!strongIndicators.includes(keyword.toLowerCase())) {
      return false;
    }

    if (title.includes(keyword.toLowerCase())) {
      return true;
    }

    const descriptionStart = description.substring(0, 200);
    if (descriptionStart.includes(keyword.toLowerCase())) {
      return true;
    }

    return false;
  }

  private static looksLikePaperOrThesis(title: string): boolean {
    const patterns = [
      /^\d{4}/, // Starts with year
      /^\[.*\]/, // Starts with brackets
      /^\(.*\)/, // Starts with parentheses
      /vol\.\s*\d+/i, // Contains "vol. X"
      /volume\s*\d+/i, // Contains "volume X"
      /issue\s*\d+/i, // Contains "issue X"
      /n\.\s*\d+/i, // Contains "n. X" (number)
      /pp\.\s*\d+/i, // Contains "pp. X" (pages)
      /pages?\s*\d+/i, // Contains "page(s) X"
    ];

    for (const pattern of patterns) {
      if (pattern.test(title)) {
        return true;
      }
    }

    return false;
  }

  static filterBooks<T extends { title: string; description?: string; categories?: string[] }>(
    results: T[]
  ): T[] {
    return results.filter((result) => this.isBook(result));
  }
}

