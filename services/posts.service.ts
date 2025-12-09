

import { supabase } from '@/lib/supabase';
import type {
  DatabasePost,
  Post,
  PostCreateData
} from '@/types';
import { logger } from '@/utils/logger';

export class PostsService {

  private static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }


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

  static async createPost(postData: PostCreateData): Promise<Post> {
    const userId = await this.getCurrentUserId();
    const userProfile = await this.getUserProfile(userId);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          book_id: postData.bookId,
          book_title: postData.bookTitle,
          book_author: postData.bookAuthor,
          book_cover_url: postData.bookCoverUrl || null,
          book_status: postData.bookStatus,
          content: postData.content,
          rating: postData.rating || null,
          has_spoiler: postData.hasSpoiler,
          reading_progress: postData.readingProgress || null,
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          const migrationError = new Error('Tabela de posts não existe. Por favor, execute a migração: database/migration_social_features.sql');
          (migrationError as any).code = 'MIGRATION_REQUIRED';
          throw migrationError;
        }
        throw error;
      }

      return this.mapDatabasePostToPost(data as DatabasePost, userId);
    } catch (error) {
      logger.error('Error creating post', error, { postData, userId });
      throw error;
    }
  }

  static async getPosts(limit = 20, offset = 0): Promise<Post[]> {
    const userId = await this.getCurrentUserId();

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          const migrationError = new Error('Tabela de posts não existe. Por favor, execute a migração: database/migration_social_features.sql');
          (migrationError as any).code = 'MIGRATION_REQUIRED';
          throw migrationError;
        }
        throw error;
      }

      const posts = await Promise.all(
        (data || []).map(async (post: DatabasePost) => {
          const postUserId = post.user_id;
          const userProfile = await this.getUserProfile(postUserId);
          const isLiked = await this.checkIfLiked(post.id, userId);

          return {
            ...this.mapDatabasePostToPost(post, userId),
            userName: userProfile.name,
            userUsername: userProfile.username,
            userAvatar: userProfile.avatar,
            isLiked,
          };
        })
      );

      return posts;
    } catch (error) {
      logger.error('Error fetching posts', error, { userId, limit, offset });
      throw error;
    }
  }

  static async getPostsByUserId(userId: string, limit = 20, offset = 0): Promise<Post[]> {
    const currentUserId = await this.getCurrentUserId();

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const userProfile = await this.getUserProfile(userId);

      const posts = await Promise.all(
        (data || []).map(async (post: DatabasePost) => {
          const isLiked = await this.checkIfLiked(post.id, currentUserId);
          return {
            ...this.mapDatabasePostToPost(post, currentUserId),
            userName: userProfile.name,
            userUsername: userProfile.username,
            userAvatar: userProfile.avatar,
            isLiked,
          };
        })
      );

      return posts;
    } catch (error) {
      logger.error('Error fetching user posts', error, { userId, limit, offset });
      throw error;
    }
  }

  static async toggleLike(postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const userId = await this.getCurrentUserId();

    try {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        const { data: post } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        const newLikesCount = Math.max(0, (post?.likes_count || 0) - 1);

        await supabase
          .from('posts')
          .update({ likes_count: newLikesCount })
          .eq('id', postId);

        return { isLiked: false, likesCount: newLikesCount };
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: userId,
          });

        const { data: post } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        const newLikesCount = (post?.likes_count || 0) + 1;

        await supabase
          .from('posts')
          .update({ likes_count: newLikesCount })
          .eq('id', postId);

        return { isLiked: true, likesCount: newLikesCount };
      }
    } catch (error) {
      logger.error('Error toggling like', error, { postId, userId });
      throw error;
    }
  }

  static async updatePost(
    postId: string,
    updates: {
      content?: string;
      rating?: number;
      bookStatus?: string;
      hasSpoiler?: boolean;
      readingProgress?: number;
    }
  ): Promise<Post> {
    const userId = await this.getCurrentUserId();

    try {
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;
      if (existingPost.user_id !== userId) {
        throw new Error('Você não tem permissão para editar este post');
      }

      // Update post
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.bookStatus !== undefined) updateData.book_status = updates.bookStatus;
      if (updates.hasSpoiler !== undefined) updateData.has_spoiler = updates.hasSpoiler;
      if (updates.readingProgress !== undefined) updateData.reading_progress = updates.readingProgress;

      const { data, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;

      const userProfile = await this.getUserProfile(userId);
      const isLiked = await this.checkIfLiked(postId, userId);

      return {
        ...this.mapDatabasePostToPost(data as DatabasePost, userId),
        userName: userProfile.name,
        userAvatar: userProfile.avatar,
        isLiked,
      };
    } catch (error) {
      logger.error('Error updating post', error, { postId, updates, userId });
      throw error;
    }
  }

  static async deletePost(postId: string): Promise<void> {
    const userId = await this.getCurrentUserId();

    try {
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;
      if (existingPost.user_id !== userId) {
        throw new Error('Você não tem permissão para excluir este post');
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting post', error, { postId, userId });
      throw error;
    }
  }

  private static async checkIfLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  private static mapDatabasePostToPost(dbPost: DatabasePost, currentUserId: string): Post {
    return {
      id: dbPost.id,
      userId: dbPost.user_id,
      userName: '',  
      userAvatar: undefined,
      bookId: dbPost.book_id,
      bookTitle: dbPost.book_title,
      bookAuthor: dbPost.book_author,
      bookCoverUrl: dbPost.book_cover_url || undefined,
      bookStatus: dbPost.book_status,
      content: dbPost.content,
      rating: dbPost.rating || undefined,
      hasSpoiler: dbPost.has_spoiler,
      readingProgress: dbPost.reading_progress || undefined,
      likesCount: dbPost.likes_count,
      commentsCount: dbPost.comments_count,
      isLiked: false,  
      createdAt: dbPost.created_at,
      updatedAt: dbPost.updated_at,
    };
  }
}

