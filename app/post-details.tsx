import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReviewCard, type ReviewCardData } from '@/components/social/review-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { PostsService } from '@/services/posts.service';
import type { Post } from '@/types';
import { logger } from '@/utils/logger';

export default function PostDetailsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPost = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const foundPost = await PostsService.getPostById(postId);

      if (!foundPost) {
        Alert.alert('Erro', 'Resenha não encontrada.');
        router.back();
        return;
      }

      setPost(foundPost);
    } catch (error) {
      logger.error('Error loading post', error, { postId });
      Alert.alert('Erro', 'Não foi possível carregar a resenha.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      loadPost();
    }, [loadPost])
  );

  const handleLike = async (review: ReviewCardData) => {
    if (!post || !user) return;

    try {
      const result = await PostsService.toggleLike(post.id);
      setPost({
        ...post,
        isLiked: result.isLiked,
        likesCount: result.likesCount,
      });
    } catch (error) {
      logger.error('Error toggling like', error);
    }
  };

  const handleComment = (review: ReviewCardData) => {
    if (post) {
      setPost({
        ...post,
        commentsCount: (post.commentsCount || 0) + 1,
      });
    }
  };

  const handleUserPress = (userId: string) => {
    if (!user) return;
    
    if (userId === user.id) {
      router.push('/profile');
    } else {
      router.push({
        pathname: '/user-profile',
        params: { userId },
      });
    }
  };

  const handleBookPress = (review: ReviewCardData) => {
    if (!post) return;
    router.push({
      pathname: '/book-details',
      params: {
        bookId: post.bookId,
        bookTitle: post.bookTitle,
        bookAuthor: post.bookAuthor,
        bookCoverUrl: post.bookCoverUrl || '',
      },
    });
  };

  const convertPostToReviewCardData = (post: Post): ReviewCardData => {
    const initials = post.userName
      ? post.userName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

    return {
      id: post.id,
      userId: post.userId,
      userName: post.userName,
      userUsername: post.userUsername,
      userAvatar: post.userAvatar,
      userInitials: initials,
      content: post.content,
      rating: post.rating,
      likes: post.likesCount,
      comments: post.commentsCount,
      isLiked: post.isLiked,
      createdAt: post.createdAt,
      bookId: post.bookId,
      bookTitle: post.bookTitle,
      bookAuthor: post.bookAuthor,
      bookCover: post.bookCoverUrl,
    };
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

  if (!post) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
          <ThemedView style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Resenha</ThemedText>
            <ThemedView style={{ width: 40 }} />
          </ThemedView>
          <View style={styles.emptyContainer}>
            <ThemedText>Resenha não encontrada</ThemedText>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const isOwnPost = user?.id === post.userId;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <ThemedView style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            Resenhas de {post.userName || 'Usuário'}
          </ThemedText>
          <ThemedView style={{ width: 40 }} />
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.reviewCardContainer}>
            <ReviewCard
              review={convertPostToReviewCardData(post)}
              currentUserId={user?.id}
              variant="detailed"
              showBookInfo={true}
              showComments={true}
              onLike={handleLike}
              onComment={handleComment}
              onUserPress={handleUserPress}
              onBookPress={handleBookPress}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  reviewCardContainer: {
    paddingHorizontal: 20,
  },
});

