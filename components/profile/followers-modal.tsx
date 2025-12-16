import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FollowsService } from '@/services/follows.service';
import { logger } from '@/utils/logger';

interface User {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  isFollowing: boolean;
}

interface FollowersModalProps {
  visible: boolean;
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export function FollowersModal({ visible, userId, type, onClose }: FollowersModalProps) {
  const { user: currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && userId) {
      loadUsers();
    } else {
      setUsers([]);
      setAvatarErrors(new Set());
    }
  }, [visible, userId, type]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const userList =
        type === 'followers'
          ? await FollowsService.getFollowers(userId)
          : await FollowsService.getFollowing(userId);
      setUsers(userList);
    } catch (error) {
      logger.error('Error loading users list', error, { userId, type });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;

    try {
      const newFollowingState = await FollowsService.toggleFollow(targetUserId);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, isFollowing: newFollowingState } : u))
      );
    } catch (error) {
      logger.error('Error toggling follow', error, { targetUserId });
    }
  };

  const handleUserPress = (targetUserId: string) => {
    onClose();
    if (currentUser && targetUserId === currentUser.id) {
      router.push('/profile');
    } else {
      router.push({
        pathname: '/user-profile',
        params: { userId: targetUserId },
      });
    }
  };

  const title = type === 'followers' ? 'Seguidores' : 'Seguindo';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
          <ThemedText style={styles.headerTitle}>{title}</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </ThemedView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={textColor} style={{ opacity: 0.3 }} />
            <ThemedText style={[styles.emptyText, { color: textColor, opacity: 0.6 }]}>
              {type === 'followers' ? 'Nenhum seguidor ainda' : 'Não está seguindo ninguém'}
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {users.map((user) => {
              const isCurrentUser = currentUser && user.id === currentUser.id;
              const showFollowButton = !isCurrentUser;

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userItem, { borderBottomColor: borderColor }]}
                  onPress={() => handleUserPress(user.id)}
                  activeOpacity={0.7}>
                  <View style={styles.userInfo}>
                    {user.avatarUrl && !avatarErrors.has(user.id) ? (
                      <Image
                        source={{
                          uri: user.avatarUrl.includes('?t=')
                            ? user.avatarUrl
                            : `${user.avatarUrl}?t=${Date.now()}`,
                        }}
                        style={styles.avatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        onError={() => {
                          setAvatarErrors((prev) => new Set(prev).add(user.id));
                        }}
                      />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
                        <Ionicons name="person" size={24} color={tintColor} />
                      </View>
                    )}
                    <View style={styles.userDetails}>
                      <ThemedText style={styles.userName} numberOfLines={1}>
                        {user.name}
                      </ThemedText>
                      {user.username && (
                        <ThemedText style={[styles.userUsername, { color: textColor, opacity: 0.6 }]} numberOfLines={1}>
                          @{user.username}
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  {showFollowButton && (
                    <TouchableOpacity
                      style={[
                        styles.followButton,
                        {
                          backgroundColor: user.isFollowing ? 'transparent' : tintColor,
                          borderColor: tintColor,
                        },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(user.id);
                      }}
                      activeOpacity={0.7}>
                      <ThemedText
                        style={[
                          styles.followButtonText,
                          { color: user.isFollowing ? tintColor : '#FFFFFF' },
                        ]}>
                        {user.isFollowing ? 'Seguindo' : 'Seguir'}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 14,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

