import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumBadge } from '@/components/premium-badge';
import { FollowersModal } from '@/components/profile/followers-modal';
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
    isPremium?: boolean;
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
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);

  const loadUserProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      if (currentUser?.id === userId) {
        setIsCurrentUser(true);
        router.replace('/profile');
        return;
      }

      setIsCurrentUser(false);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, username, avatar_url, bio, is_premium')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        logger.warn('Profile not found in profiles table, trying auth', { error: profileError });
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
        isPremium: profile.is_premium || false,
      });

      try {
        const userBooks = await BooksService.getBooks();
        setBooks([]);
      } catch (error) {
        logger.warn('Could not load user books', { error });
      }

      try {
        const userPosts = await PostsService.getPostsByUserId(userId, 10, 0);
        setPosts(userPosts);
      } catch (error) {
        logger.warn('Could not load user posts', { error });
      }

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
      
      const stats = await FollowsService.getFollowStats(userId);
      setFollowStats(stats);
    } catch (error) {
      logger.error('Error toggling follow', error, { userId });
      Alert.alert('Erro', 'Não foi possível seguir/deixar de seguir o usuário.');
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!userProfile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
          <ThemedView style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Perfil</ThemedText>
            <ThemedView style={{ width: 40 }} />
          </ThemedView>
          <View style={styles.emptyContainer}>
            <ThemedText>Perfil não encontrado</ThemedText>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <ThemedView style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Perfil</ThemedText>
        <ThemedView style={{ width: 40 }} />
      </ThemedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.profileCard}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
                : ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.01)']
            }
            style={styles.profileGradient}>
            
            <View style={styles.avatarSection}>
              <View
                style={[
                  styles.avatarContainer,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
                    borderColor: tintColor,
                    shadowColor: tintColor,
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
                    onError={() => setAvatarLoadError(true)}
                    onLoad={() => setAvatarLoadError(false)}
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={56}
                    color={isDark ? 'rgba(255, 255, 255, 0.9)' : tintColor}
                  />
                )}
              </View>
            </View>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <ThemedText style={styles.userName}>
                  {userProfile.name}
                </ThemedText>
                {userProfile.isPremium && (
                  <PremiumBadge size="medium" style={styles.premiumBadge} />
                )}
              </View>
              {userProfile.username && (
                <View style={styles.usernameRow}>
                  <Ionicons name="at" size={12} color={tintColor} />
                  <ThemedText style={[styles.userUsername, { color: tintColor }]}>
                    {userProfile.username}
                  </ThemedText>
                </View>
              )}
              {userProfile.bio && (
                <ThemedText style={[styles.bio, { color: textColor }]}>
                  {userProfile.bio}
                </ThemedText>
              )}
            </View>

            <View style={[styles.statsRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.7}
                onPress={() => setFollowersModalVisible(true)}>
                <ThemedText style={styles.statValue}>{followStats.followersCount}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
                  Seguidores
                </ThemedText>
              </TouchableOpacity>
              
              <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]} />
              
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.7}
                onPress={() => setFollowingModalVisible(true)}>
                <ThemedText style={styles.statValue}>{followStats.followingCount}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
                  Seguindo
                </ThemedText>
              </TouchableOpacity>
              
              <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]} />
              
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <ThemedText style={styles.statValue}>{posts.length}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
                  Resenhas
                </ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleFollowToggle}
              activeOpacity={0.9}>
              <LinearGradient
                colors={following ? ['transparent', 'transparent'] : [tintColor, tintColor + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.followButton,
                  {
                    borderColor: tintColor,
                    borderWidth: following ? 2 : 0,
                  },
                ]}>
                <Ionicons
                  name={following ? 'checkmark-circle' : 'person-add'}
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
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {posts.length > 0 && (
          <View style={styles.postsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="book" size={22} color={tintColor} />
                <ThemedText style={styles.sectionTitle}>Resenhas Públicas</ThemedText>
              </View>
              <View style={[styles.postsBadge, { backgroundColor: tintColor + '20' }]}>
                <ThemedText style={[styles.postsBadgeText, { color: tintColor }]}>
                  {posts.length}
                </ThemedText>
              </View>
            </View>

            {posts.map((post, index) => (
              <TouchableOpacity
                key={post.id}
                style={[
                  styles.postItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
                onPress={() => {
                  router.push({
                    pathname: '/post-details',
                    params: { postId: post.id },
                  });
                }}
                activeOpacity={0.7}>
                <View style={styles.postHeader}>
                  <View style={[styles.postIconContainer, { backgroundColor: tintColor + '15' }]}>
                    <Ionicons name="book-outline" size={18} color={tintColor} />
                  </View>
                  <View style={styles.postInfo}>
                    <ThemedText style={styles.postTitle} numberOfLines={1}>
                      {post.bookTitle}
                    </ThemedText>
                    <ThemedText
                      style={[styles.postAuthor, { color: textColor }]}
                      numberOfLines={1}>
                      {post.bookAuthor}
                    </ThemedText>
                  </View>
                  {post.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <ThemedText style={styles.ratingText}>{post.rating}</ThemedText>
                    </View>
                  )}
                </View>
                {post.content && (
                  <ThemedText
                    style={[styles.postContent, { color: textColor }]}
                    numberOfLines={3}>
                    {post.content}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <FollowersModal
        visible={followersModalVisible}
        userId={userProfile.id}
        type="followers"
        onClose={() => setFollowersModalVisible(false)}
      />

      <FollowersModal
        visible={followingModalVisible}
        userId={userProfile.id}
        type="following"
        onClose={() => setFollowingModalVisible(false)}
      />
    </SafeAreaView>
    </>
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
    paddingTop: 24,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  profileGradient: {
    padding: 20,
    paddingTop: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  premiumBadge: {
    marginTop: 0,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  userUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 16,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    alignSelf: 'center',
    height: 32,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  postsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  postsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postsBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  postItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  postIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  postAuthor: {
    fontSize: 13,
    opacity: 0.6,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});

