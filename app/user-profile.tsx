import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PointsDisplay } from '@/components/social';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';
import { BooksService } from '@/services/books.service';
import { FollowsService, type FollowStats } from '@/services/follows.service';
import { PostsService } from '@/services/posts.service';
import type { Book, Post } from '@/types';
import { logger } from '@/utils/logger';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
  } | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followStats, setFollowStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  });
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const loadUserProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Check if it's the current user
      if (currentUser?.id === userId) {
        setIsCurrentUser(true);
        router.replace('/profile');
        return;
      }

      setIsCurrentUser(false);

      // Load profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, username, avatar_url, bio')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        // Fallback to auth metadata if profiles table doesn't exist or user not found
        logger.warn('Profile not found in profiles table, trying auth', { error: profileError });
        // For now, show error
        Alert.alert('Erro', 'Perfil não encontrado');
        router.back();
        return;
      }

      setUserProfile({
        id: profile.user_id,
        name: profile.name,
        username: profile.username || undefined,
        avatarUrl: profile.avatar_url || undefined,
        bio: profile.bio || undefined,
      });

      // Load user's books (public books only - you may want to adjust this)
      try {
        const userBooks = await BooksService.getBooks();
        // Filter to show only if user wants to share
        // For now, we'll show a limited view
        setBooks([]);
      } catch (error) {
        logger.warn('Could not load user books', { error });
      }

      // Load user's posts
      try {
        const userPosts = await PostsService.getPostsByUserId(userId, 10, 0);
        setPosts(userPosts);
      } catch (error) {
        logger.warn('Could not load user posts', { error });
      }

      // Load follow stats
      const stats = await FollowsService.getFollowStats(userId);
      setFollowStats(stats);
      setFollowing(stats.isFollowing);
    } catch (error) {
      logger.error('Error loading user profile', error, { userId });
      Alert.alert('Erro', 'Não foi possível carregar o perfil do usuário.');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile])
  );

  const handleFollowToggle = async () => {
    if (!userId) return;

    try {
      const newFollowingState = await FollowsService.toggleFollow(userId);
      setFollowing(newFollowingState);
      
      // Update stats
      const stats = await FollowsService.getFollowStats(userId);
      setFollowStats(stats);
    } catch (error) {
      logger.error('Error toggling follow', error, { userId });
      Alert.alert('Erro', 'Não foi possível seguir/deixar de seguir o usuário.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <ThemedView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Perfil
          </ThemedText>
          <ThemedView style={{ width: 40 }} />
        </ThemedView>
        <View style={styles.emptyContainer}>
          <ThemedText>Perfil não encontrado</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Perfil
          </ThemedText>
          <ThemedView style={{ width: 40 }} />
        </ThemedView>

        <ThemedView style={styles.profileHeader}>
          <ThemedView
            style={[
              styles.avatarContainer,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : tintColor + '20',
              },
            ]}>
            {userProfile.avatarUrl && !avatarLoadError ? (
              <Image
                source={{ 
                  uri: userProfile.avatarUrl.includes('?t=') 
                    ? userProfile.avatarUrl 
                    : `${userProfile.avatarUrl}?t=${Date.now()}`,
                }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
                placeholderContentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={userProfile.avatarUrl}
                onError={() => {
                  setAvatarLoadError(true);
                }}
                onLoad={() => {
                  setAvatarLoadError(false);
                }}
              />
            ) : (
              <Ionicons
                name="person"
                size={48}
                color={isDark ? 'rgba(255, 255, 255, 0.9)' : tintColor}
              />
            )}
          </ThemedView>
          <ThemedText type="title" style={styles.userName}>
            {userProfile.name}
          </ThemedText>
          {userProfile.username && (
            <ThemedText style={[styles.userUsername, { color: tintColor }]}>
              @{userProfile.username}
            </ThemedText>
          )}
          {userProfile.bio && (
            <ThemedText style={[styles.bio, { color: textColor, opacity: 0.7 }]}>
              {userProfile.bio}
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.followButton,
              {
                backgroundColor: following ? 'transparent' : tintColor,
                borderColor: tintColor,
                borderWidth: following ? 1 : 0,
              },
            ]}
            onPress={handleFollowToggle}
            activeOpacity={0.7}>
            <Ionicons
              name={following ? 'checkmark' : 'add'}
              size={20}
              color={following ? tintColor : '#FFFFFF'}
            />
            <ThemedText
              style={[
                styles.followButtonText,
                { color: following ? tintColor : '#FFFFFF' },
              ]}>
              {following ? 'Seguindo' : 'Seguir'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{followStats.followersCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { opacity: 0.6 }]}>Seguidores</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statDivider, { backgroundColor: textColor + '20' }]} />
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{followStats.followingCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { opacity: 0.6 }]}>Seguindo</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statDivider, { backgroundColor: textColor + '20' }]} />
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{posts.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { opacity: 0.6 }]}>Resenhas</ThemedText>
          </ThemedView>
        </ThemedView>

        {posts.length > 0 && (
          <ThemedView style={styles.postsSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Resenhas
            </ThemedText>
            {posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={[
                  styles.postItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={() => {
                  // Navigate to post details
                  router.push({
                    pathname: '/post-details',
                    params: { postId: post.id },
                  });
                }}>
                <ThemedText style={styles.postTitle} numberOfLines={2}>
                  {post.bookTitle}
                </ThemedText>
                <ThemedText
                  style={[styles.postAuthor, { color: textColor, opacity: 0.6 }]}
                  numberOfLines={1}>
                  {post.bookAuthor}
                </ThemedText>
                {post.content && (
                  <ThemedText
                    style={[styles.postContent, { color: textColor, opacity: 0.8 }]}
                    numberOfLines={3}>
                    {post.content}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    minWidth: 120,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  postsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  postItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
  },
});

