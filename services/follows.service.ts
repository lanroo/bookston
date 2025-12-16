/**
 * Follows Service
 * Handles user following/unfollowing functionality
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export class FollowsService {
  /**
   * Get the current authenticated user's ID
   */
  private static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  /**
   * Follow a user
   */
  static async followUser(userId: string): Promise<void> {
    const currentUserId = await this.getCurrentUserId();

    if (currentUserId === userId) {
      throw new Error('Cannot follow yourself');
    }

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: userId,
        });

      if (error) {
        if (error.code === '23505') {
          return;
        }
        throw error;
      }

      try {
        const { NotificationsService } = await import('@/services/notifications.service');
        await NotificationsService.createNotification(userId, 'follow', currentUserId);
      } catch (notifError) {
        logger.debug('Notification creation failed (trigger should handle it)', { notifError });
      }
    } catch (error) {
      logger.error('Error following user', error, { userId, currentUserId });
      throw error;
    }
  }

  static async unfollowUser(userId: string): Promise<void> {
    const currentUserId = await this.getCurrentUserId();

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error unfollowing user', error, { userId, currentUserId });
      throw error;
    }
  }

  /**
   * Get follow stats for a user
   */
  static async getFollowStats(userId: string): Promise<FollowStats> {
    const currentUserId = await this.getCurrentUserId();

    try {
      const [followersResult, followingResult, isFollowingResult] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId),
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .single(),
      ]);

      return {
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
        isFollowing: isFollowingResult.data !== null,
      };
    } catch (error) {
      logger.error('Error getting follow stats', error, { userId });
      return {
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
      };
    }
  }

  /**
   * Toggle follow status
   */
  static async toggleFollow(userId: string): Promise<boolean> {
    const stats = await this.getFollowStats(userId);
    
    if (stats.isFollowing) {
      await this.unfollowUser(userId);
      return false;
    } else {
      await this.followUser(userId);
      return true;
    }
  }


  static async getFollowers(userId: string, limit = 100): Promise<Array<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    isFollowing: boolean;
  }>> {
    try {
      const { data: follows, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId)
        .limit(limit);

      if (error) throw error;

      if (!follows || follows.length === 0) {
        return [];
      }

      const followerIds = follows.map((f) => f.follower_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, username, avatar_url')
        .in('user_id', followerIds);

      if (profilesError) {
        logger.warn('Error fetching follower profiles', { error: profilesError });
        return [];
      }

      let followingSet = new Set<string>();
      try {
        const currentUserId = await this.getCurrentUserId();
        const { data: currentUserFollows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
          .in('following_id', followerIds);

        followingSet = new Set(
          currentUserFollows?.map((f) => f.following_id) || []
        );
      } catch (error) {
        logger.debug('User not authenticated, skipping follow status check');
      }

      return (profiles || []).map((profile) => ({
        id: profile.user_id,
        name: profile.name || 'Usuário',
        username: profile.username || undefined,
        avatarUrl: profile.avatar_url || undefined,
        isFollowing: followingSet.has(profile.user_id),
      }));
    } catch (error) {
      logger.error('Error getting followers', error, { userId });
      return [];
    }
  }

  static async getFollowing(userId: string, limit = 100): Promise<Array<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    isFollowing: boolean;
  }>> {
    try {
      const { data: follows, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .limit(limit);

      if (error) throw error;

      if (!follows || follows.length === 0) {
        return [];
      }

      const followingIds = follows.map((f) => f.following_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, username, avatar_url')
        .in('user_id', followingIds);

      if (profilesError) {
        logger.warn('Error fetching following profiles', { error: profilesError });
        return [];
      }

      let followingSet = new Set<string>();
      try {
        const currentUserId = await this.getCurrentUserId();
        const { data: currentUserFollows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
          .in('following_id', followingIds);

        followingSet = new Set(
          currentUserFollows?.map((f) => f.following_id) || []
        );
      } catch (error) {
        logger.debug('User not authenticated, skipping follow status check');
      }

      return (profiles || []).map((profile) => ({
        id: profile.user_id,
        name: profile.name || 'Usuário',
        username: profile.username || undefined,
        avatarUrl: profile.avatar_url || undefined,
        isFollowing: followingSet.has(profile.user_id),
      }));
    } catch (error) {
      logger.error('Error getting following', error, { userId });
      return [];
    }
  }
}

