import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FeedPost, type FeedPost as FeedPostType } from './feed-post';

interface FeedSectionProps {
  posts: FeedPostType[];
  onPostPress?: (post: FeedPostType) => void;
  onLike?: (post: FeedPostType) => void;
  onComment?: (post: FeedPostType) => void;
  isLoading?: boolean;
}

export function FeedSection({
  posts,
  onPostPress,
  onLike,
  onComment,
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

  return (
    <View style={styles.container}>
      {posts.map((post) => (
        <FeedPost
          key={post.id}
          post={post}
          onPress={onPostPress}
          onLike={onLike}
          onComment={onComment}
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
    paddingHorizontal: 16,
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

