import { BookRecommendationsService, type BookRecommendation } from '@/services/recommendations/book-recommendations.service';
import { useCallback, useEffect, useState } from 'react';

export interface UseBookRecommendationsReturn {
  recommendations: BookRecommendation[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getSimilarBooks: (title: string, author: string) => Promise<BookRecommendation[]>;
}

export function useBookRecommendations(limit: number = 20): UseBookRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await BookRecommendationsService.getRecommendations(limit);
      setRecommendations(results);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load recommendations');
      setError(error);
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const getSimilarBooks = useCallback(async (title: string, author: string): Promise<BookRecommendation[]> => {
    try {
      return await BookRecommendationsService.getSimilarBooks(title, author, 10);
    } catch (err) {
      console.error('Error getting similar books:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh: loadRecommendations,
    getSimilarBooks,
  };
}

