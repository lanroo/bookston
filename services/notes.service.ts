import { supabase } from '@/lib/supabase';
import type { DatabaseFolder, DatabaseNote, Folder, Note } from '@/types';
import { logger } from '@/utils/logger';

export class NotesService {

  private static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }
  
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
      
      return (data || []).map((note: DatabaseNote) => ({
        id: note.id,
        title: note.title,
        content: note.content ?? '',
        folderId: note.folder_id ?? null,
        userId: note.user_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      }));
    } catch (error) {
      logger.error('Error fetching notes', error, { folderId });
      throw error;
    }
  }

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
      
      const dbNote = data as DatabaseNote;
      return {
        id: dbNote.id,
        title: dbNote.title,
        content: dbNote.content ?? '',
        folderId: dbNote.folder_id ?? null,
        userId: dbNote.user_id,
        createdAt: dbNote.created_at,
        updatedAt: dbNote.updated_at,
      };
    } catch (error) {
      logger.error('Error fetching note by ID', error, { noteId });
      return null;
    }
  }

  static async createNote(note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: note.title,
          content: note.content,
          folder_id: note.folderId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      const dbNote = data as DatabaseNote;
      return {
        id: dbNote.id,
        title: dbNote.title,
        content: dbNote.content ?? '',
        folderId: dbNote.folder_id ?? null,
        userId: dbNote.user_id,
        createdAt: dbNote.created_at,
        updatedAt: dbNote.updated_at,
      };
    } catch (error) {
      logger.error('Error creating note', error, { noteTitle: note.title });
      throw error;
    }
  }

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
        })
        .eq('id', noteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      const dbNote = data as DatabaseNote;
      return {
        id: dbNote.id,
        title: dbNote.title,
        content: dbNote.content ?? '',
        folderId: dbNote.folder_id ?? null,
        userId: dbNote.user_id,
        createdAt: dbNote.created_at,
        updatedAt: dbNote.updated_at,
      };
    } catch (error) {
      logger.error('Error updating note', error, { noteId, updates });
      throw error;
    }
  }

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
      logger.error('Error deleting note', error, { noteId });
      throw error;
    }
  }

  static async getFolders(): Promise<Folder[]> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*, notes(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((folder: DatabaseFolder) => ({
        id: folder.id,
        name: folder.name,
        userId: folder.user_id,
        color: folder.color ?? undefined,
        noteCount: folder.notes?.[0]?.count || 0,
        createdAt: folder.created_at,
        updatedAt: folder.updated_at,
      }));
    } catch (error) {
      logger.error('Error fetching folders', error);
      throw error;
    }
  }

  static async createFolder(folder: Omit<Folder, 'id' | 'userId' | 'noteCount' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    const userId = await this.getCurrentUserId();
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: folder.name,
          user_id: userId,
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
      logger.error('Error creating folder', error, { folderName: folder.name });
      throw error;
    }
  }

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
      logger.error('Error deleting folder', error, { folderId });
      throw error;
    }
  }
}

