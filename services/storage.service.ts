/**
 * Storage Service
 * Handles file uploads to Supabase Storage
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { File } from 'expo-file-system';

export class StorageService {
  /**
   * Upload avatar image to Supabase Storage
   */
  static async uploadAvatar(imageUri: string, userId: string): Promise<string> {
    try {
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      const filePath = `${userId}/avatar.${fileExt}`;

      await this.deleteAvatar(userId);

      const file = new File(imageUri);
      const arrayBuffer = await file.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('A imagem selecionada está vazia ou corrompida. Tente selecionar outra imagem.');
      }
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: contentType,
          upsert: true,
          cacheControl: '3600',
        });

      if (error) {
        if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
          throw new Error('Bucket de avatares não configurado. Por favor, crie o bucket "avatars" no Supabase Storage.');
        }
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const urlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;
      
      return urlWithTimestamp;
    } catch (error: any) {
      logger.error('Error uploading avatar', error, { userId, imageUri });

      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        throw new Error('Bucket de avatares não configurado. Por favor, crie o bucket "avatars" no Supabase Storage.');
      }
      throw error;
    }
  }

  /**
   * Delete avatar from Supabase Storage
   */
  static async deleteAvatar(userId: string): Promise<void> {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('avatars')
        .list(`${userId}`, {
          limit: 100,
          offset: 0,
        });

      if (listError) {
        if (listError.message?.includes('not found')) {
          return;
        }
        throw listError;
      }

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(filePaths);

        if (deleteError) {
          logger.warn('Error deleting old avatar files', { error: deleteError, userId, filePaths });
        }
      }
    } catch (error) {
      logger.warn('Error deleting avatar', { error, userId });
    }
  }
}

