import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationsRealtime } from '@/hooks/use-notifications-realtime';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';
import { NotificationsService, type Notification } from '@/services/notifications.service';
import { logger } from '@/utils/logger';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useNotificationsRealtime();
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const notifs = await NotificationsService.getNotifications(50, 0);
      setNotifications(notifs);
    } catch (error) {
      logger.error('Error loading notifications', error);
      Alert.alert('Erro', 'Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();

      // Listen for new notifications in real-time to refresh the list
      if (!user) return;

      const channel = supabase
        .channel('notifications-listener')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            // Reload notifications when any change happens
            await loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [loadNotifications, user])
  );

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await NotificationsService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        logger.error('Error marking notification as read', error);
      }
    }

    // Navigate based on type
    if (notification.type === 'follow') {
      router.push({
        pathname: '/user-profile',
        params: { userId: notification.actorId },
      });
    } else if (notification.postId) {
      router.push({
        pathname: '/post-details',
        params: { postId: notification.postId },
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      logger.error('Error marking all as read', error);
      Alert.alert('Erro', 'Não foi possível marcar todas como lidas.');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return 'person-add';
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'mention':
        return 'at';
      default:
        return 'notifications';
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actorName || 'Alguém';
    switch (notification.type) {
      case 'follow':
        return `${actorName} começou a seguir você`;
      case 'like':
        return `${actorName} curtiu sua resenha${notification.postTitle ? ` sobre "${notification.postTitle}"` : ''}`;
      case 'comment':
        return `${actorName} comentou na sua resenha${notification.postTitle ? ` sobre "${notification.postTitle}"` : ''}`;
      case 'mention':
        return `${actorName} mencionou você`;
      default:
        return 'Nova notificação';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText style={styles.headerTitle}>Notificações</ThemedText>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}>
            <ThemedText style={[styles.markAllText, { color: tintColor }]}>
              Marcar todas como lidas
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={textColor} style={{ opacity: 0.3 }} />
          <ThemedText style={[styles.emptyText, { color: textColor, opacity: 0.6 }]}>
            Nenhuma notificação ainda
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: textColor, opacity: 0.4 }]}>
            Você receberá notificações quando alguém seguir você, curtir ou comentar suas resenhas
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tintColor} />
          }
          showsVerticalScrollIndicator={false}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                {
                  backgroundColor: notification.read
                    ? 'transparent'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(0, 0, 0, 0.02)',
                  borderBottomColor: borderColor,
                },
              ]}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}>
              <View style={styles.notificationContent}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (user && notification.actorId === user.id) {
                      router.push('/profile');
                    } else {
                      router.push({
                        pathname: '/user-profile',
                        params: { userId: notification.actorId },
                      });
                    }
                  }}
                  activeOpacity={0.7}>
                  {notification.actorAvatar && !avatarErrors.has(notification.actorId) ? (
                    <Image
                      source={{
                        uri: notification.actorAvatar.includes('?t=')
                          ? notification.actorAvatar
                          : `${notification.actorAvatar}?t=${Date.now()}`,
                      }}
                      style={styles.avatar}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      onError={() => {
                        setAvatarErrors((prev) => new Set(prev).add(notification.actorId));
                      }}
                    />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
                      <Ionicons name="person" size={24} color={tintColor} />
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.notificationTextContainer}>
                  <View style={styles.notificationHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: tintColor + '15' }]}>
                      <Ionicons
                        name={getNotificationIcon(notification.type) as any}
                        size={16}
                        color={tintColor}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (user && notification.actorId === user.id) {
                          router.push('/profile');
                        } else {
                          router.push({
                            pathname: '/user-profile',
                            params: { userId: notification.actorId },
                          });
                        }
                      }}
                      activeOpacity={0.7}
                      style={{ flex: 1 }}>
                      <ThemedText style={styles.notificationText} numberOfLines={2}>
                        {getNotificationText(notification)}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <ThemedText style={[styles.notificationTime, { color: textColor, opacity: 0.5 }]}>
                    {formatTimeAgo(notification.createdAt)}
                  </ThemedText>
                </View>

                {!notification.read && (
                  <View style={[styles.unreadDot, { backgroundColor: tintColor }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});

