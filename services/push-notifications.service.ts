import { supabase } from '@/lib/supabase';
import { NotificationsService } from '@/services/notifications.service';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATION_ENABLED_KEY = '@push_notifications_enabled';
const EXPO_PUSH_TOKEN_KEY = '@expo_push_token';

export class PushNotificationsService {

  static configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }


  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      logger.error('Error requesting notification permissions', error);
      return false;
    }
  }

  
  private static getProjectId(): string | null {
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_PROJECT_ID ||
      Constants.expoConfig?.extra?.projectId ||
      null;

    return projectId || null;
  }

  
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const projectId = this.getProjectId();
      
      if (!projectId) {
        logger.warn('Push notifications: No projectId found. Remote push notifications are not available, but local notifications will work.');
        return null;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenData.data;
        await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
        
    
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const platform = Platform.OS;
            await NotificationsService.savePushToken(token, undefined, platform);
          }
        } catch (dbError) {
          logger.warn('Error saving push token to database', { error: dbError });
        }
        
        return token;
      } catch (error) {

        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('projectId')) {
          logger.warn('Push notifications: Unable to get push token. Local notifications will still work.');
          return null;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error registering for push notifications', error);
      return null;
    }
  }

  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    } catch (error) {
      logger.error('Error getting stored token', error);
      return null;
    }
  }

  static async isEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      return value === 'true';
    } catch (error) {
      logger.error('Error checking notification status', error);
      return false;
    }
  }

  static async enable(): Promise<boolean> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return false;
    }

    try {
      await this.registerForPushNotifications();
    } catch (error) {
      logger.error('Error registering push token (local notifications will still work)', error);
    }

    try {
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
      return true;
    } catch (error) {
      logger.error('Error saving notification settings', error);
      return false;
    }
  }


  static async disable(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      logger.error('Error disabling push notifications', error);
    }
  }

  /**
   * Schedule a local notification
   * @param title - Notification title
   * @param body - Notification body
   * @param trigger - Notification trigger (time, date, etc.)
   * @returns Promise<string | null> - Notification identifier or null if failed
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger,
      });
      return identifier;
    } catch (error) {
      logger.error('Error scheduling notification', error, { title, body });
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   * @param identifier - Notification identifier
   */
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      logger.error('Error canceling notification', error, { identifier });
    }
  }


  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      logger.error('Error canceling all notifications', error);
    }
  }

  /**
   * Get notification permissions status
   * @returns Promise<Notifications.PermissionStatus> - Current permission status
   */
  static async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      logger.error('Error getting permission status', error);
      return Notifications.PermissionStatus.UNDETERMINED;
    }
  }
}

