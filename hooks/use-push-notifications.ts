import { PushNotificationsService } from '@/services/push-notifications.service';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';

export interface UsePushNotificationsReturn {
  isEnabled: boolean;
  isLoading: boolean;
  permissionStatus: Notifications.PermissionStatus;
  expoPushToken: string | null;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus>(
    Notifications.PermissionStatus.UNDETERMINED
  );
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  /**
   * Refresh notification status and permissions
   */
  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [enabled, status, token] = await Promise.all([
        PushNotificationsService.isEnabled(),
        PushNotificationsService.getPermissionStatus(),
        PushNotificationsService.getStoredToken(),
      ]);

      setIsEnabled(enabled);
      setPermissionStatus(status);
      setExpoPushToken(token);
    } catch (error) {
      console.error('Error refreshing notification status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Enable push notifications
   */
  const enable = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await PushNotificationsService.enable();
      
      if (success) {
        await refreshStatus();
      }
      
      return success;
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  const disable = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await PushNotificationsService.disable();
      await refreshStatus();
    } catch (error) {
      console.error('Error disabling push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  useEffect(() => {
    PushNotificationsService.configureNotifications();
    refreshStatus();


    const subscription = Notifications.addNotificationReceivedListener(() => {
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [refreshStatus]);

  return {
    isEnabled,
    isLoading,
    permissionStatus,
    expoPushToken,
    enable,
    disable,
    refreshStatus,
  };
}

