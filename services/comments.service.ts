

import { supabase } from '@/lib/supabase';
import type {
  Comment,
  CommentCreateData,
  DatabaseComment
} from '@/types';
import { logger } from '@/utils/logger';

export class CommentsService {
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
   * Get user profile info
   */
  private static async getUserProfile(userId: string): Promise<{ name: string; username?: string; avatar?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === userId) {
      return {
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        username: user.user_metadata?.username,
        avatar: user.user_metadata?.avatar_url,
      };
    }
    return {
      name: 'Usuário',
    };
  }

  /**
   * Create a new comment
   */
  static async createComment(commentData: CommentCreateData): Promise<Comment> {
    const userId = await this.getCurrentUserId();
    const userProfile = await this.getUserProfile(userId);

    try {
      // Create comment
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: commentData.postId,
          user_id: userId,
          content: commentData.content,
          likes_count: 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          const migrationError = new Error('Tabela de comentários não existe. Por favor, execute a migração: database/migration_social_features.sql');
          (migrationError as any).code = 'MIGRATION_REQUIRED';
          throw migrationError;
        }
        throw error;
      }

      const { data: post } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', commentData.postId)
        .single();

      const newCommentsCount = (post?.comments_count || 0) + 1;

      await supabase
        .from('posts')
        .update({ comments_count: newCommentsCount })
        .eq('id', commentData.postId);

      return {
        ...this.mapDatabaseCommentToComment(data as DatabaseComment, userId),
        userName: userProfile.name,
        userUsername: userProfile.username,
        userAvatar: userProfile.avatar,
      };
    } catch (error) {
      logger.error('Error creating comment', error, { commentData, userId });
      throw error;
    }
  }

  /**
   * Get comments for a post
   */
  static async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const userId = await this.getCurrentUserId();

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          logger.warn('Comments table does not exist yet. Please run the migration: database/migration_social_features.sql');
          return [];
        }
        throw error;
      }

      const comments = await Promise.all(
        (data || []).map(async (comment: DatabaseComment) => {
          const commentUserId = comment.user_id;
          const userProfile = await this.getUserProfile(commentUserId);
          const isLiked = await this.checkIfLiked(comment.id, userId);

          return {
            ...this.mapDatabaseCommentToComment(comment, userId),
            userName: userProfile.name,
            userUsername: userProfile.username,
            userAvatar: userProfile.avatar,
            isLiked,
          };
        })
      );

      return comments;
    } catch (error) {
      logger.error('Error fetching comments', error, { postId, userId });
      throw error;
    }
  }

  /**
   * Toggle like on a comment
   */
  static async toggleLike(commentId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const userId = await this.getCurrentUserId();

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);

        const { data: comment } = await supabase
          .from('comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();

        const newLikesCount = Math.max(0, (comment?.likes_count || 0) - 1);

        await supabase
          .from('comments')
          .update({ likes_count: newLikesCount })
          .eq('id', commentId);

        return { isLiked: false, likesCount: newLikesCount };
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userId,
          });

        const { data: comment } = await supabase
          .from('comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();

        const newLikesCount = (comment?.likes_count || 0) + 1;

        await supabase
          .from('comments')
          .update({ likes_count: newLikesCount })
          .eq('id', commentId);

        return { isLiked: true, likesCount: newLikesCount };
      }
    } catch (error) {
      logger.error('Error toggling comment like', error, { commentId, userId });
      throw error;
    }
  }

  /**
   * Check if current user liked a comment
   */
  private static async checkIfLiked(commentId: string, userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  private static mapDatabaseCommentToComment(dbComment: DatabaseComment, currentUserId: string): Comment {
    return {
      id: dbComment.id,
      postId: dbComment.post_id,
      userId: dbComment.user_id,
      userName: '',  
      userAvatar: undefined,  
      content: dbComment.content,
      likesCount: dbComment.likes_count,
      isLiked: false,  
      createdAt: dbComment.created_at,
      updatedAt: dbComment.updated_at,
    };
  }
}

