/**
 * Points Service
 * Handles gamification and points system
 * Following Single Responsibility Principle (SRP)
 */

import { supabase } from '@/lib/supabase';
import type { DatabaseUserPoints, UserPoints } from '@/types';
import { logger } from '@/utils/logger';

const POINTS_CONFIG = {
  POST_CREATED: 10,
  POST_LIKED: 1,
  COMMENT_CREATED: 5,
  COMMENT_LIKED: 1,
} as const;


const calculateLevel = (totalPoints: number): number => {
  return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
};

export class PointsService {
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
   * Award points to a user for an action
   */
  static async awardPoints(
    userId: string,
    action: 'post_created' | 'post_liked' | 'comment_created' | 'comment_liked',
    relatedId: string
  ): Promise<UserPoints> {
    try {
      const points = this.getPointsForAction(action);

      // Get current points
      const { data: currentPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      const currentTotal = currentPoints?.total_points || 0;
      const currentFromPosts = currentPoints?.points_from_posts || 0;
      const currentFromLikes = currentPoints?.points_from_likes || 0;
      const currentFromComments = currentPoints?.points_from_comments || 0;

      let newTotal = currentTotal + points;
      let newFromPosts = currentFromPosts;
      let newFromLikes = currentFromLikes;
      let newFromComments = currentFromComments;

      switch (action) {
        case 'post_created':
          newFromPosts += points;
          break;
        case 'post_liked':
        case 'comment_liked':
          newFromLikes += points;
          break;
        case 'comment_created':
          newFromComments += points;
          break;
      }

      const newLevel = calculateLevel(newTotal);

      // Update or insert user points
      const { data, error } = await supabase
        .from('user_points')
        .upsert({
          user_id: userId,
          total_points: newTotal,
          points_from_posts: newFromPosts,
          points_from_likes: newFromLikes,
          points_from_comments: newFromComments,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create transaction record
      await supabase.from('points_transactions').insert({
        user_id: userId,
        points,
        action,
        related_id: relatedId,
      });

      return this.mapDatabaseUserPointsToUserPoints(data as DatabaseUserPoints);
    } catch (error) {
      logger.error('Error awarding points', error, { userId, action, relatedId });
      throw error;
    }
  }

  /**
   * Get user points
   */
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No points record yet, return default
          return {
            userId,
            totalPoints: 0,
            pointsFromPosts: 0,
            pointsFromLikes: 0,
            pointsFromComments: 0,
            level: 1,
            updatedAt: new Date().toISOString(),
          };
        }
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          logger.warn('User points table does not exist yet. Please run the migration: database/migration_social_features.sql');
          return {
            userId,
            totalPoints: 0,
            pointsFromPosts: 0,
            pointsFromLikes: 0,
            pointsFromComments: 0,
            level: 1,
            updatedAt: new Date().toISOString(),
          };
        }
        throw error;
      }

      return this.mapDatabaseUserPointsToUserPoints(data as DatabaseUserPoints);
    } catch (error) {
      logger.error('Error fetching user points', error, { userId });
      throw error;
    }
  }

  /**
   * Get points leaderboard
   */
  static async getLeaderboard(limit = 10): Promise<UserPoints[]> {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((item) => this.mapDatabaseUserPointsToUserPoints(item as DatabaseUserPoints));
    } catch (error) {
      logger.error('Error fetching leaderboard', error, { limit });
      throw error;
    }
  }

  /**
   * Get points for an action
   */
  private static getPointsForAction(action: string): number {
    switch (action) {
      case 'post_created':
        return POINTS_CONFIG.POST_CREATED;
      case 'post_liked':
        return POINTS_CONFIG.POST_LIKED;
      case 'comment_created':
        return POINTS_CONFIG.COMMENT_CREATED;
      case 'comment_liked':
        return POINTS_CONFIG.COMMENT_LIKED;
      default:
        return 0;
    }
  }

  /**
   * Map database user points to UserPoints type
   */
  private static mapDatabaseUserPointsToUserPoints(dbPoints: DatabaseUserPoints): UserPoints {
    return {
      userId: dbPoints.user_id,
      totalPoints: dbPoints.total_points,
      pointsFromPosts: dbPoints.points_from_posts,
      pointsFromLikes: dbPoints.points_from_likes,
      pointsFromComments: dbPoints.points_from_comments,
      level: dbPoints.level,
      updatedAt: dbPoints.updated_at,
    };
  }
}

