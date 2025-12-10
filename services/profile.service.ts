

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export class ProfileService {

  static async updateProfile(data: { name?: string; username?: string; avatarUrl?: string | null }): Promise<void> {
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
        ...(data.avatarUrl !== undefined && { avatar_url: data.avatarUrl }),
      };

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: updatedMetadata,
      });

      if (authError) throw authError;

      // Sync to profiles table if it exists
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            name: data.name !== undefined ? data.name : currentMetadata.name || user.email?.split('@')[0] || 'Usuário',
            username: data.username !== undefined ? data.username : currentMetadata.username || null,
            avatar_url: data.avatarUrl !== undefined ? data.avatarUrl : (currentMetadata.avatar_url || null),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (profileError) {
          // Log but don't fail if profiles table doesn't exist yet
          logger.warn('Error syncing profile to profiles table', { error: profileError });
        }
      } catch (profileSyncError) {
        // Profiles table might not exist yet, that's okay
        logger.warn('Could not sync to profiles table (may not exist)', { error: profileSyncError });
      }
    } catch (error) {
      logger.error('Error updating profile', error, { data });
      throw error;
    }
  }


  static async isUsernameAvailable(username: string): Promise<boolean> {
    if (!username || username.length < 3) return false;
    if (username.length > 20) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    
    try {
      // Check if username exists in profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is what we want
        logger.warn('Error checking username availability', { error });
        return true; // If we can't check, assume available
      }

      // If profile exists and belongs to another user, username is taken
      if (existingProfile && existingProfile.user_id !== user.id) {
        return false;
      }
    
    return true;
    } catch (error) {
      logger.warn('Error checking username availability', { error });
      return true; // If we can't check, assume available
    }
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

