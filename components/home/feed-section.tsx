import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ReviewCard, type ReviewCardData } from '@/components/social/review-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { FeedPost as FeedPostType } from './feed-post';

interface FeedSectionProps {
  posts: FeedPostType[];
  currentUserId?: string;
  onPostPress?: (post: FeedPostType) => void;
  onBookPress?: (post: FeedPostType) => void;
  onLike?: (post: FeedPostType) => void;
  onComment?: (post: FeedPostType) => void;
  onOptions?: (post: FeedPostType) => void;
  onUserPress?: (userId: string) => void;
  isLoading?: boolean;
}

export function FeedSection({
  posts,
  currentUserId,
  onPostPress,
  onBookPress,
  onLike,
  onComment,
  onOptions,
  onUserPress,
  isLoading,
}: FeedSectionProps) {
  const textColor = useThemeColor({}, 'text');

  if (posts.length === 0 && !isLoading) {
    return (
      <ThemedView style={styles.emptyState}>
        <ThemedText style={[styles.emptyStateText, { color: textColor, opacity: 0.5 }]}>
          Nenhum post ainda. Seja o primeiro a compartilhar!
        </ThemedText>
      </ThemedView>
    );
  }

  // Convert FeedPost to ReviewCardData
  const convertToReviewCardData = (post: FeedPostType): ReviewCardData => ({
    id: post.id,
    userId: post.userId,
    userName: post.userName,
    userUsername: post.userUsername,
    userAvatar: post.userAvatar,
    userIsPremium: post.userIsPremium ?? false,
    content: post.content,
    rating: post.rating,
    likes: post.likes,
    comments: post.comments,
    isLiked: post.isLiked,
    createdAt: post.createdAt,
    bookTitle: post.bookTitle,
    bookAuthor: post.bookAuthor,
    bookCover: post.bookCover,
    // Include bookId if available for navigation
    ...(post.bookId && { bookId: post.bookId }),
  });

  return (
    <View style={styles.container}>
      {posts.map((post) => (
        <ReviewCard
          key={post.id}
          review={convertToReviewCardData(post)}
          currentUserId={currentUserId}
          showBookInfo={true}
          onPress={onPostPress}
          onBookPress={onBookPress}
          onLike={onLike}
          onComment={onComment}
          onOptions={onOptions}
          onUserPress={onUserPress}
        />
      ))}
      {isLoading && (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: textColor, opacity: 0.5 }]}>
            Carregando...
          </ThemedText>
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
});

