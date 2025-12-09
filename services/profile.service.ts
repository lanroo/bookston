

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export class ProfileService {

  static async updateProfile(data: { name?: string; username?: string }): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const currentMetadata = user.user_metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
      };

      const { error } = await supabase.auth.updateUser({
        data: updatedMetadata,
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating profile', error, { data });
      throw error;
    }
  }


  static async isUsernameAvailable(username: string): Promise<boolean> {
    if (!username || username.length < 3) return false;
    if (username.length > 20) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    
    return true;
  }


  static validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { valid: false, error: 'Username é obrigatório' };
    }

    if (username.length < 3) {
      return { valid: false, error: 'Username deve ter pelo menos 3 caracteres' };
    }

    if (username.length > 20) {
      return { valid: false, error: 'Username deve ter no máximo 20 caracteres' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, error: 'Username pode conter apenas letras, números e underscore' };
    }

    if (username.startsWith('_') || username.endsWith('_')) {
      return { valid: false, error: 'Username não pode começar ou terminar com underscore' };
    }

    if (username.includes('__')) {
      return { valid: false, error: 'Username não pode conter underscores consecutivos' };
    }

    return { valid: true };
  }
}

