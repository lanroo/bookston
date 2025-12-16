

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
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, username, avatar_url')
        .eq('user_id', userId)
        .single();

      if (profile && !error) {
        return {
          name: profile.name || 'Usuário',
          username: profile.username || undefined,
          avatar: profile.avatar_url || undefined,
        };
      }

      logger.warn('Profile not found in profiles table, trying auth.users', { userId });
      
      // Fallback to auth metadata for current user
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
        username: undefined,
        avatar: undefined,
      };
    } catch (error) {
      logger.error('Error getting user profile', error, { userId });
    return {
      name: 'Usuário',
        username: undefined,
        avatar: undefined,
    };
    }
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
          parent_comment_id: commentData.parentCommentId || null,
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

      // Separate top-level comments and replies
      const topLevelComments: DatabaseComment[] = [];
      const repliesMap = new Map<string, DatabaseComment[]>();

      for (const dbComment of (data || []) as DatabaseComment[]) {
        if (dbComment.parent_comment_id) {
          // This is a reply
          const parentId = dbComment.parent_comment_id;
          if (!repliesMap.has(parentId)) {
            repliesMap.set(parentId, []);
          }
          repliesMap.get(parentId)!.push(dbComment);
        } else {
          // This is a top-level comment
          topLevelComments.push(dbComment);
        }
      }

      // Build comment tree
      const comments: Comment[] = [];

      for (const dbComment of topLevelComments) {
        const userProfile = await this.getUserProfile(dbComment.user_id);
        const isLiked = await this.checkIfLiked(dbComment.id, userId);

        // Get replies for this comment
        const replyComments = repliesMap.get(dbComment.id) || [];
        const replies: Comment[] = [];

        for (const replyDbComment of replyComments) {
          const replyUserProfile = await this.getUserProfile(replyDbComment.user_id);
          const replyIsLiked = await this.checkIfLiked(replyDbComment.id, userId);
          const parentUserProfile = await this.getUserProfile(dbComment.user_id);

          replies.push({
            ...this.mapDatabaseCommentToComment(replyDbComment, userId),
            userName: replyUserProfile.name,
            userUsername: replyUserProfile.username,
            userAvatar: replyUserProfile.avatar,
            isLiked: replyIsLiked,
            parentCommentId: dbComment.id,
            parentCommentUserName: parentUserProfile.name,
            parentCommentUserUsername: parentUserProfile.username,
          });
        }

        comments.push({
          ...this.mapDatabaseCommentToComment(dbComment, userId),
            userName: userProfile.name,
            userUsername: userProfile.username,
            userAvatar: userProfile.avatar,
            isLiked,
          replies,
          repliesCount: replies.length,
        });
      }

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
   * Update a comment
   */
  static async updateComment(commentId: string, content: string): Promise<Comment> {
    const userId = await this.getCurrentUserId();

    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', userId) // Ensure user owns the comment
        .select()
        .single();

      if (error) {
        throw error;
      }

      const userProfile = await this.getUserProfile(userId);
      const isLiked = await this.checkIfLiked(commentId, userId);

      return {
        ...this.mapDatabaseCommentToComment(data as DatabaseComment, userId),
        userName: userProfile.name,
        userUsername: userProfile.username,
        userAvatar: userProfile.avatar,
        isLiked,
      };
    } catch (error) {
      logger.error('Error updating comment', error, { commentId, userId });
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<void> {
    const userId = await this.getCurrentUserId();

    try {
      // Get post_id before deleting
      const { data: comment } = await supabase
        .from('comments')
        .select('post_id')
        .eq('id', commentId)
        .eq('user_id', userId) // Ensure user owns the comment
        .single();

      if (!comment) {
        throw new Error('Comment not found or you do not have permission to delete it');
      }

      // Delete the comment
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Update post comments count
      const { data: post } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', comment.post_id)
        .single();

      const newCommentsCount = Math.max(0, (post?.comments_count || 0) - 1);

      await supabase
        .from('posts')
        .update({ comments_count: newCommentsCount })
        .eq('id', comment.post_id);
    } catch (error) {
      logger.error('Error deleting comment', error, { commentId, userId });
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
      parentCommentId: dbComment.parent_comment_id || undefined,
      createdAt: dbComment.created_at,
      updatedAt: dbComment.updated_at,
    };
  }
}

