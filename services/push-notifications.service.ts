import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

const NOTIFICATION_ENABLED_KEY = '@push_notifications_enabled';
const EXPO_PUSH_TOKEN_KEY = '@expo_push_token';

/**
 * Push Notifications Service
 * 
 * Handles all push notification related operations:
 * - Requesting permissions
 * - Registering for push tokens
 * - Managing notification settings
 * - Sending local notifications
 */
export class PushNotificationsService {
  /**
   * Configure notification behavior
   */
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

  /**
   * Request notification permissions
   * @returns Promise<boolean> - true if permissions granted, false otherwise
   */
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

  /**
   * Get project ID from various sources
   * @returns string | null - Project ID or null if not found
   */
  private static getProjectId(): string | null {
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_PROJECT_ID ||
      Constants.expoConfig?.extra?.projectId ||
      null;

    return projectId || null;
  }

  /**
   * Register for push notifications and get Expo push token
   * Note: Push tokens require a projectId. In Expo Go, this may not be available.
   * Local notifications will still work without a push token.
   * @returns Promise<string | null> - Expo push token or null if registration failed or projectId unavailable
   */
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

  /**
   * Get stored Expo push token
   * @returns Promise<string | null> - Stored token or null if not found
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    } catch (error) {
      logger.error('Error getting stored token', error);
      return null;
    }
  }

  /**
   * Check if push notifications are enabled
   * @returns Promise<boolean> - true if enabled, false otherwise
   */
  static async isEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      return value === 'true';
    } catch (error) {
      logger.error('Error checking notification status', error);
      return false;
    }
  }

  /**
   * Enable push notifications
   * Note: This enables notifications even if push token registration fails.
   * Local notifications will work regardless of push token availability.
   * @returns Promise<boolean> - true if successfully enabled (permissions granted), false otherwise
   */
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

