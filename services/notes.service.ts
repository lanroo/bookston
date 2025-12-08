/**
 * Notes Service
 * Handles all notes-related business logic
 * Following Single Responsibility Principle (SRP)
 * 
 * SECURITY: All methods automatically filter by the authenticated user's ID.
 * Even if userId is passed, RLS policies ensure users can only access their own data.
 */

import { supabase } from '@/lib/supabase';
import type { Folder, Note } from '@/types';

export class NotesService {
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
   * Get all notes for the current authenticated user
   * @param folderId Optional folder ID to filter notes
   */
  static async getNotes(folderId?: string | null): Promise<Note[]> {
    const userId = await this.getCurrentUserId();
    try {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (folderId !== undefined) {
        if (folderId === null) {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', folderId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Mapear campos snake_case para camelCase
      return (data || []).map((note: any) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        folderId: note.folder_id,
        userId: note.user_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  /**
   * Get a single note by ID for the current authenticated user
   */
  static async getNoteById(noteId: string): Promise<Note | null> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      if (!data) return null;
      
      // Mapear campos snake_case para camelCase
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        folderId: data.folder_id,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  }

  /**
   * Create a new note for the current authenticated user
   * Note: userId is automatically set from the authenticated user
   */
  static async createNote(note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: note.title,
          content: note.content,
          folder_id: note.folderId,
          user_id: userId, // Automatically set from authenticated user
        })
        .select()
        .single();

      if (error) throw error;
      
      // Mapear campos snake_case para camelCase
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        folderId: data.folder_id,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Update an existing note for the current authenticated user
   */
  static async updateNote(
    noteId: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'folderId'>>
  ): Promise<Note> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: updates.title,
          content: updates.content,
          folder_id: updates.folderId,
          // updated_at é atualizado automaticamente pelo trigger do banco
        })
        .eq('id', noteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Mapear campos snake_case para camelCase
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        folderId: data.folder_id,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  /**
   * Delete a note for the current authenticated user
   */
  static async deleteNote(noteId: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Get all folders for the current authenticated user
   */
  static async getFolders(): Promise<Folder[]> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*, notes(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our Folder type
      return (data || []).map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        userId: folder.user_id,
        color: folder.color,
        noteCount: folder.notes?.[0]?.count || 0,
        createdAt: folder.created_at,
        updatedAt: folder.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  }

  /**
   * Create a new folder for the current authenticated user
   * Note: userId is automatically set from the authenticated user
   */
  static async createFolder(folder: Omit<Folder, 'id' | 'userId' | 'noteCount' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: folder.name,
          user_id: userId, // Automatically set from authenticated user
          color: folder.color,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        color: data.color,
        noteCount: 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  /**
   * Delete a folder for the current authenticated user
   */
  static async deleteFolder(folderId: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }
}

