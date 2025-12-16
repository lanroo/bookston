
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export type NotificationType = 'follow' | 'like' | 'comment' | 'mention';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  actorName?: string;
  actorUsername?: string;
  actorAvatar?: string;
  targetId?: string;
  postId?: string;
  postTitle?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
}

export class NotificationsService {

  private static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  private static async getUserProfile(userId: string): Promise<{
    name: string;
    username?: string;
    avatarUrl?: string;
  }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, username, avatar_url')
        .eq('user_id', userId)
        .single();

      if (profile) {
        return {
          name: profile.name || 'Usuário',
          username: profile.username || undefined,
          avatarUrl: profile.avatar_url || undefined,
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === userId) {
        return {
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          username: user.user_metadata?.username,
          avatarUrl: user.user_metadata?.avatar_url,
        };
      }

      return { name: 'Usuário' };
    } catch (error) {
      logger.warn('Error fetching user profile for notification', { error, userId });
      return { name: 'Usuário' };
    }
  }

  static async getNotifications(limit = 50, offset = 0): Promise<Notification[]> {
    const userId = await this.getCurrentUserId();

    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      if (!notifications || notifications.length === 0) {
        return [];
      }

      const enrichedNotifications = await Promise.all(
        notifications.map(async (notif) => {
          const actorProfile = await this.getUserProfile(notif.actor_id);
          
          let postTitle: string | undefined;
          if (notif.post_id) {
            try {
              const { data: post } = await supabase
                .from('posts')
                .select('book_title')
                .eq('id', notif.post_id)
                .single();
              
              postTitle = post?.book_title;
            } catch (error) {
              logger.warn('Error fetching post for notification', { error, postId: notif.post_id });
            }
          }

          return {
            id: notif.id,
            userId: notif.user_id,
            type: notif.type as NotificationType,
            actorId: notif.actor_id,
            actorName: actorProfile.name,
            actorUsername: actorProfile.username,
            actorAvatar: actorProfile.avatarUrl,
            targetId: notif.target_id || undefined,
            postId: notif.post_id || undefined,
            postTitle,
            read: notif.read,
            createdAt: notif.created_at,
          };
        })
      );

      return enrichedNotifications;
    } catch (error) {
      logger.error('Error getting notifications', error, { userId, limit, offset });
      return [];
    }
  }

  static async getNotificationStats(): Promise<NotificationStats> {
    const userId = await this.getCurrentUserId();

    try {
      const [unreadResult, totalResult] = await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

      return {
        unreadCount: unreadResult.count || 0,
        totalCount: totalResult.count || 0,
      };
    } catch (error) {
      logger.error('Error getting notification stats', error, { userId });
      return { unreadCount: 0, totalCount: 0 };
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const userId = await this.getCurrentUserId();

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking notification as read', error, { notificationId, userId });
      throw error;
    }
  }

  static async markAllAsRead(): Promise<void> {
    const userId = await this.getCurrentUserId();

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking all notifications as read', error, { userId });
      throw error;
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    const userId = await this.getCurrentUserId();

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting notification', error, { notificationId, userId });
      throw error;
    }
  }

  static async deleteAllNotifications(): Promise<void> {
    const userId = await this.getCurrentUserId();

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting all notifications', error, { userId });
      throw error;
    }
  }

  static async createNotification(
    userId: string,
    type: NotificationType,
    actorId: string,
    options?: {
      targetId?: string;
      postId?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type,
        actor_id: actorId,
        target_id: options?.targetId || null,
        post_id: options?.postId || null,
      });

      if (error) throw error;

      await this.sendPushNotification(userId, type, actorId, options);
    } catch (error) {
      logger.error('Error creating notification', error, { userId, type, actorId, options });
      throw error;
    }
  }

  static async savePushToken(token: string, deviceId?: string, platform?: string): Promise<void> {
    const userId = await this.getCurrentUserId();

    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token,
          device_id: deviceId || null,
          platform: platform || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error saving push token', error, { userId });
      throw error;
    }
  }

  private static async getUserPushTokens(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map((row) => row.token);
    } catch (error) {
      logger.error('Error getting user push tokens', error, { userId });
      return [];
    }
  }

  private static async sendPushNotification(
    userId: string,
    type: NotificationType,
    actorId: string,
    options?: {
      targetId?: string;
      postId?: string;
    }
  ): Promise<void> {
    try {
      const actorProfile = await this.getUserProfile(actorId);
      const actorName = actorProfile.name || 'Alguém';

      const tokens = await this.getUserPushTokens(userId);
      if (tokens.length === 0) {
        return;
      }

      let title = 'Nova notificação';
      let body = '';

      switch (type) {
        case 'follow':
          title = 'Novo seguidor';
          body = `${actorName} começou a seguir você`;
          break;
        case 'like':
          title = 'Nova curtida';
          body = `${actorName} curtiu sua resenha`;
          break;
        case 'comment':
          title = 'Novo comentário';
          body = `${actorName} comentou na sua resenha`;
          break;
        case 'mention':
          title = 'Você foi mencionado';
          body = `${actorName} mencionou você`;
          break;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Obter URL do Supabase da variável de ambiente
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        
        if (!supabaseUrl) {
          throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurada');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            notification: {
              user_id: userId,
              type,
              actor_id: actorId,
              post_id: options?.postId,
            },
            actorProfile: {
              name: actorName,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Edge Function error: ${response.statusText}`);
        }
      } catch (edgeFunctionError) {
        logger.warn('Edge Function not available, using local notifications', { error: edgeFunctionError });
        const { PushNotificationsService } = await import('@/services/push-notifications.service');
        await PushNotificationsService.scheduleLocalNotification(title, body, null);
      }

      logger.debug('Push notification sent', { userId, type, actorId, tokensCount: tokens.length });
    } catch (error) {
      logger.error('Error sending push notification', error, { userId, type, actorId });
    }
  }
}

