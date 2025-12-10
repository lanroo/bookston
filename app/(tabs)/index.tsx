import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeedSection, GenreButtons, SearchBar, type FeedPost as FeedPostType, type Genre } from '@/components/home';
import { PostOptionsSheet } from '@/components/social';
import { useTabBarPadding } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { PointsService } from '@/services/points.service';
import { PostsService } from '@/services/posts.service';
import type { Post } from '@/types';
import { logger } from '@/utils/logger';

export default function HomeScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();
  const tabBarPadding = useTabBarPadding();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [feedPosts, setFeedPosts] = useState<FeedPostType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState<string | undefined>();
  const [pointsRefreshKey, setPointsRefreshKey] = useState(0);
  const [userPoints, setUserPoints] = useState<{ totalPoints: number; level: number }>({ totalPoints: 0, level: 1 });
  const [optionsSheetVisible, setOptionsSheetVisible] = useState(false);
  const [selectedPostForOptions, setSelectedPostForOptions] = useState<Post | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  const mapPostToFeedPost = (post: Post): FeedPostType => {
    return {
      id: post.id,
      userId: post.userId,
      userName: post.userName,
      userUsername: post.userUsername,
      userAvatar: post.userAvatar,
      bookTitle: post.bookTitle,
      bookAuthor: post.bookAuthor,
      bookCover: post.bookCoverUrl,
      content: post.content,
      rating: post.rating,
      createdAt: post.createdAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      isLiked: post.isLiked,
    };
  };

  const loadFeedPosts = useCallback(async () => {
    if (!user) {
  
      setFeedPosts([]);
      return;
    }

    setIsLoading(true);
    setFeedPosts([]);
    try {
      const posts = await PostsService.getPosts(20, 0);
      const mappedPosts = posts.map(mapPostToFeedPost);
      setFeedPosts(mappedPosts);
    } catch (error) {
      logger.error('Error loading feed posts', error);
      setFeedPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadUserPoints = useCallback(async () => {
    if (!user) return;
    try {
      const points = await PointsService.getUserPoints(user.id);
      if (points) {
        setUserPoints({ totalPoints: points.totalPoints, level: points.level });
      }
    } catch (error) {
      logger.error('Error loading user points', error);
    }
  }, [user]);

  const loadUserAvatar = useCallback(async () => {
    if (!user) {
      setUserAvatarUrl(null);
      setAvatarLoadError(false);
      return;
    }
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profile?.avatar_url) {
        setUserAvatarUrl(profile.avatar_url);
        setAvatarLoadError(false);
      } else if (user.user_metadata?.avatar_url) {
        setUserAvatarUrl(user.user_metadata.avatar_url);
        setAvatarLoadError(false);
      } else {
        setUserAvatarUrl(null);
        setAvatarLoadError(false);
      }
    } catch (error) {
      if (user.user_metadata?.avatar_url) {
        setUserAvatarUrl(user.user_metadata.avatar_url);
        setAvatarLoadError(false);
      } else {
        setUserAvatarUrl(null);
        setAvatarLoadError(false);
      }
    }
  }, [user]);

  // Clear feed when user changes
  useEffect(() => {
    // Clear feed immediately when user ID changes
    setFeedPosts([]);
    setUserPoints({ totalPoints: 0, level: 1 });
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadFeedPosts();
        loadUserPoints();
        setPointsRefreshKey((prev: number) => prev + 1);
      }
    }, [loadFeedPosts, loadUserPoints, user])
  );

  const handleGenrePress = (genre: Genre) => {
    // Toggle selection - se já está selecionado, deseleciona
    setSelectedGenreId(selectedGenreId === genre.id ? undefined : genre.id);
    // TODO: Implementar navegação para filtro por gênero
  };

  const handlePostPress = (post: FeedPostType) => {
    // TODO: Implementar navegação para detalhes do post
    // router.push({
    //   pathname: '/post-details',
    //   params: { postId: post.id },
    // });
  };

  const handleLike = async (post: FeedPostType) => {
    if (!user) return;

    try {
      const result = await PostsService.toggleLike(post.id);

      if (result.isLiked) {
        await PointsService.awardPoints(user.id, 'post_liked', post.id);
        setPointsRefreshKey((prev: number) => prev + 1);
        loadUserPoints();
      }

      setFeedPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, isLiked: result.isLiked, likes: result.likesCount }
            : p
        )
      );
    } catch (error) {
      logger.error('Error toggling like', error);
    }
  };

  const handleComment = (post: FeedPostType) => {
    loadFeedPosts();
  };

  const handlePostOptions = (post: FeedPostType) => {
    const postForOptions: Post = {
      id: post.id,
      userId: post.userId,
      userName: post.userName,
      userAvatar: post.userAvatar,
      bookId: '',  
      bookTitle: post.bookTitle,
      bookAuthor: post.bookAuthor,
      bookCoverUrl: post.bookCover,
      bookStatus: 'read',  
      content: post.content,
      rating: post.rating,
      hasSpoiler: false,  
      likesCount: post.likes,
      commentsCount: post.comments,
      isLiked: post.isLiked || false,
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    };
    setSelectedPostForOptions(postForOptions);
    setOptionsSheetVisible(true);
  };

  const handleEditPost = (post: Post) => {
    router.push({
      pathname: '/create-post',
      params: { postId: post.id },
    });
  };

  const handleDeletePost = async (post: Post) => {
    if (!user) return;

    try {
      await PostsService.deletePost(post.id);
      setFeedPosts((prev) => prev.filter((p) => p.id !== post.id));
      loadFeedPosts();
    } catch (error) {
      logger.error('Error deleting post', error);
      Alert.alert('Erro', 'Não foi possível excluir a resenha. Tente novamente.');
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>

      <View style={styles.headerSection}>

        <View style={styles.headerTopRow}>
          <View style={styles.greetingContainer}>
            <ThemedText style={[
              styles.greeting, 
              { color: isDark ? 'rgba(255, 255, 255, 0.5)' : textColor }
            ]}>
              Olá,
            </ThemedText>
            <ThemedText 
              type="title" 
              style={[
                styles.userName,
                { color: textColor }
              ]}
              numberOfLines={1}>
              {userName}
            </ThemedText>
          </View>
          
          <View style={styles.headerActions}>
            <SearchBar />
            <TouchableOpacity
              style={[
                styles.avatarContainer,
                {
                  backgroundColor: isDark 
                    ? 'rgba(255, 255, 255, 0.12)' 
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark 
                    ? 'rgba(255, 255, 255, 0.15)' 
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              onPress={() => router.push('/profile')}
              activeOpacity={0.7}>
              {userAvatarUrl && !avatarLoadError ? (
                <Image
                  source={{
                    uri: userAvatarUrl.includes('?t=')
                      ? userAvatarUrl
                      : `${userAvatarUrl}?t=${Date.now()}`,
                  }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={200}
                  placeholderContentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={userAvatarUrl}
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
                  size={20}
                  color={isDark ? 'rgba(255, 255, 255, 0.8)' : tintColor}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.pointsCardWrapper}
          onPress={() => router.push('/profile')}
          activeOpacity={0.95}>
          <LinearGradient
            colors={
              isDark
                ? ['#1A1A2E', '#16213E', '#1A1A2E']
                : ['#FFFFFF', '#F5F7FA', '#FFFFFF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.pointsCard,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            
            <View style={styles.pointsMainRow}>
              <View style={styles.trophyContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFC107', '#FFB300']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.trophyBg}>
                  <Ionicons name="trophy" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>

              {/* Points Info */}
              <View style={styles.pointsInfo}>
                <ThemedText 
                  style={[
                    styles.pointsLabel, 
                    { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }
                  ]}>
                  MEUS PONTOS
                </ThemedText>
                <ThemedText style={[styles.pointsValue, { color: textColor }]}>
                  {userPoints.totalPoints.toLocaleString()}
                  <ThemedText style={[styles.pointsUnit, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>
                    {' '}pts
                  </ThemedText>
                </ThemedText>
              </View>

              <View style={styles.levelContainer}>
                <LinearGradient
                  colors={[tintColor, tintColor + 'DD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.levelBadge}>
                  <ThemedText style={styles.levelNumber}>{userPoints.level}</ThemedText>
                </LinearGradient>
                <ThemedText style={[styles.levelLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>
                  NÍVEL
                </ThemedText>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min((userPoints.totalPoints % 1000) / 10, 100)}%`,
                      backgroundColor: tintColor,
                    }
                  ]} 
                />
              </View>
              <ThemedText style={[styles.progressLabel, { color: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.4)' }]}>
                {1000 - (userPoints.totalPoints % 1000)} pts para nível {userPoints.level + 1}
              </ThemedText>
            </View>

          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.genresSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Explorar por Gênero
        </ThemedText>
        <GenreButtons selectedGenreId={selectedGenreId} onGenrePress={handleGenrePress} />
      </View>

      <View style={styles.feedSection}>
        <View style={styles.feedHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Feed
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/create-post')}>
            <Ionicons name="add-circle" size={28} color={tintColor} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.feedScroll}
          contentContainerStyle={[styles.feedContent, { paddingBottom: tabBarPadding }]}
          showsVerticalScrollIndicator={false}>
          <FeedSection
            posts={feedPosts}
            currentUserId={user?.id}
            onPostPress={handlePostPress}
            onLike={handleLike}
            onComment={handleComment}
            onOptions={handlePostOptions}
            isLoading={isLoading}
          />
        </ScrollView>
      </View>

      <PostOptionsSheet
        visible={optionsSheetVisible}
        post={selectedPostForOptions}
        onClose={() => {
          setOptionsSheetVisible(false);
          setSelectedPostForOptions(null);
        }}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  greetingContainer: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    opacity: 0.6,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  pointsCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pointsMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  trophyContainer: {
    marginRight: 14,
  },
  trophyBg: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  pointsValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  pointsUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  progressSection: {
    marginTop: 2,
  },
  progressBar: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  genresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  feedSection: {
    flex: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 20,
  },
});
