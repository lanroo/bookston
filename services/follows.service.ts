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
          // Already following
          return;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error following user', error, { userId, currentUserId });
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
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
}

