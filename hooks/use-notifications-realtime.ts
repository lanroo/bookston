import { useNotificationContext } from '@/contexts/NotificationContext';
import { NotificationsService } from '@/services/notifications.service';
import { logger } from '@/utils/logger';
import { useEffect, useState } from 'react';

export interface UseNotificationsRealtimeReturn {
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useNotificationsRealtime(): UseNotificationsRealtimeReturn {
  const { unreadCount } = useNotificationContext();
  const [isLoading, setIsLoading] = useState(true);

  const loadCount = async () => {
    try {
      await NotificationsService.getNotificationStats();
      setIsLoading(false);
    } catch (error) {
      logger.error('Error loading notification count', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCount();
  }, []);

  return {
    unreadCount,
    isLoading,
    refresh: loadCount,
  };
}

