import { supabase } from '@/lib/supabase';
import { NotificationsService } from '@/services/notifications.service';
import { PushNotificationsService } from '@/services/push-notifications.service';
import { logger } from '@/utils/logger';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const loadCount = async () => {
      try {
        const stats = await NotificationsService.getNotificationStats();
        setUnreadCount(stats.unreadCount);
      } catch (error) {
        logger.error('Error loading notification count', error);
      }
    };

    loadCount();

    // Subscribe to notifications table changes
    const channel = supabase
      .channel('notifications-realtime-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          logger.debug('Notification change detected', { event: payload.eventType });
          
          // Reload count
          await loadCount();

          // If it's a new notification (INSERT), send push notification
          if (payload.eventType === 'INSERT') {
            try {
              const newNotification = payload.new as any;
              const actorProfile = await NotificationsService['getUserProfile'](newNotification.actor_id);
              const actorName = actorProfile.name || 'Alguém';
              
              let title = 'Nova notificação';
              let body = '';
              
              switch (newNotification.type) {
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
              
              // Send local push notification
              await PushNotificationsService.scheduleLocalNotification(title, body, null);
            } catch (error) {
              logger.error('Error sending push notification', error);
            }
          }
        }
      )
      .subscribe();

    // Also refresh periodically (every 30 seconds)
    const interval = setInterval(loadCount, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}

