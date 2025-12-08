/**
 * Books Service
 * Handles all books-related business logic
 * Following Single Responsibility Principle (SRP)
 * 
 * SECURITY: All methods automatically filter by the authenticated user's ID.
 * Even if userId is passed, RLS policies ensure users can only access their own data.
 */

import { supabase } from '@/lib/supabase';
import type { Book, BookStatus } from '@/types';

export class BooksService {
  /**
   * Get the current authenticated user's ID
   * Throws error if user is not authenticated
   */
  private static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  /**
   * Get all books for the current authenticated user
   * @param status Optional status to filter books
   */
  static async getBooks(status?: BookStatus): Promise<Book[]> {
    const userId = await this.getCurrentUserId();
    try {
      let query = supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        status: book.status,
        userId: book.user_id,
        coverUrl: book.cover_url,
        rating: book.rating,
        notes: book.notes,
        startedAt: book.started_at,
        finishedAt: book.finished_at,
        createdAt: book.created_at,
        updatedAt: book.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  static async getBookById(bookId: string): Promise<Book | null> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      if (!data) return null;
      
      return {
        id: data.id,
        title: data.title,
        author: data.author,
        status: data.status,
        userId: data.user_id,
        coverUrl: data.cover_url,
        rating: data.rating,
        notes: data.notes,
        startedAt: data.started_at,
        finishedAt: data.finished_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error fetching book:', error);
      return null;
    }
  }

  /**
   * Create a new book for the current authenticated user
   * Note: userId is automatically set from the authenticated user
   */
  static async createBook(book: Omit<Book, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Book> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('books')
        .insert({
          title: book.title,
          author: book.author,
          status: book.status,
          user_id: userId,
          cover_url: book.coverUrl,
          rating: book.rating,
          notes: book.notes,
          started_at: book.startedAt,
          finished_at: book.finishedAt,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        author: data.author,
        status: data.status,
        userId: data.user_id,
        coverUrl: data.cover_url,
        rating: data.rating,
        notes: data.notes,
        startedAt: data.started_at,
        finishedAt: data.finished_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  }

  /**
   * Update an existing book for the current authenticated user
   */
  static async updateBook(
    bookId: string,
    updates: Partial<Pick<Book, 'title' | 'author' | 'status' | 'rating' | 'notes' | 'startedAt' | 'finishedAt'>>
  ): Promise<Book> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('books')
        .update({
          title: updates.title,
          author: updates.author,
          status: updates.status,
          rating: updates.rating,
          notes: updates.notes,
          started_at: updates.startedAt,
          finished_at: updates.finishedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Mapear campos snake_case para camelCase
      return {
        id: data.id,
        title: data.title,
        author: data.author,
        status: data.status,
        userId: data.user_id,
        coverUrl: data.cover_url,
        rating: data.rating,
        notes: data.notes,
        startedAt: data.started_at,
        finishedAt: data.finished_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }

  /**
   * Delete a book for the current authenticated user
   */
  static async deleteBook(bookId: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  static async getBookStats(): Promise<{
    total: number;
    wantToRead: number;
    reading: number;
    read: number;
    rereading: number;
  }> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('books')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        wantToRead: data?.filter((b) => b.status === 'want-to-read').length || 0,
        reading: data?.filter((b) => b.status === 'reading').length || 0,
        read: data?.filter((b) => b.status === 'read').length || 0,
        rereading: data?.filter((b) => b.status === 'rereading').length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching book stats:', error);
      return { total: 0, wantToRead: 0, reading: 0, read: 0, rereading: 0 };
    }
  }
}

