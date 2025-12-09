

import { BooksService } from '@/services/books.service';
import type { Book } from '@/types';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseReorderBooksOptions {
  books: Book[];
  enabled: boolean;
}

interface UseReorderBooksReturn {
  reorderedBooks: Book[];
  reorderingBookId: string | null;
  isDragging: boolean;
  startReordering: (bookId: string) => void;
  cancelReordering: () => void;
  handleReorder: (newOrder: Book[]) => void;
  handleDragStart: () => void;
  handleDragEnd: () => Promise<void>;
}

export function useReorderBooks({
  books,
  enabled,
}: UseReorderBooksOptions): UseReorderBooksReturn {
  const [reorderedBooks, setReorderedBooks] = useState<Book[]>(books);
  const [reorderingBookId, setReorderingBookId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOrderRef = useRef<Book[] | null>(null);
  const reorderedBooksRef = useRef<Book[]>(books);

  useEffect(() => {
    reorderedBooksRef.current = reorderedBooks;
  }, [reorderedBooks]);

  useEffect(() => {
    if (!reorderingBookId && !isDragging) {
      const currentIds = reorderedBooksRef.current.map(b => b.id).join(',');
      const newIds = books.map(b => b.id).join(',');
      
      if (currentIds !== newIds) {
        setReorderedBooks([...books]);
      }
    }
  }, [books, isDragging, reorderingBookId]);

  const startReordering = useCallback((bookId: string) => {
    setReorderingBookId(bookId);
    setReorderedBooks([...books]);
  }, [books]);

  const cancelReordering = useCallback(() => {
    setReorderingBookId(null);
    setReorderedBooks([...books]);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingOrderRef.current = null;
  }, [books]);

  const handleReorder = useCallback((newOrder: Book[]) => {
    if (!enabled || !reorderingBookId) return;
    
    setReorderedBooks(newOrder);
    pendingOrderRef.current = newOrder;
  }, [enabled, reorderingBookId]);

  const saveOrder = useCallback(async (booksToSave: Book[]) => {
    try {
      const bookOrders = booksToSave.map((book, idx) => ({
        bookId: book.id,
        displayOrder: idx,
      }));

      await BooksService.updateBooksOrder(bookOrders);
      logger.info('Books order saved successfully', { count: booksToSave.length });
    } catch (error) {
      logger.error('Error saving books order', error, { count: booksToSave.length });
      throw error;
    }
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(async () => {
    setIsDragging(false);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (pendingOrderRef.current && reorderingBookId) {
      const orderToSave = pendingOrderRef.current;
      
      const originalIds = books.map(b => b.id).join(',');
      const newIds = orderToSave.map(b => b.id).join(',');
      
      if (originalIds !== newIds) {
        pendingOrderRef.current = null;
        
        try {
          await saveOrder(orderToSave);
          setReorderedBooks(orderToSave);
          setReorderingBookId(null);
        } catch (error) {
          setReorderedBooks([...books]);
          setReorderingBookId(null);
        }
      } else {
        pendingOrderRef.current = null;
        setReorderingBookId(null);
      }
    } else {
      setReorderingBookId(null);
    }
  }, [reorderingBookId, books, saveOrder]);

  return {
    reorderedBooks,
    reorderingBookId,
    isDragging,
    startReordering,
    cancelReordering,
    handleReorder,
    handleDragStart,
    handleDragEnd,
  };
}

