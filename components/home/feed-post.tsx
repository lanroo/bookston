import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover?: string;
  content: string;
  rating?: number;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

interface FeedPostProps {
  post: FeedPost;
  onPress?: (post: FeedPost) => void;
  onLike?: (post: FeedPost) => void;
  onComment?: (post: FeedPost) => void;
}

export function FeedPost({ post, onPress, onLike, onComment }: FeedPostProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const separatorColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const tintColor = '#0a7ea4';

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color={tintColor}
          />
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={[styles.post, { backgroundColor, borderColor: separatorColor }]}>
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => onPress?.(post)}
        activeOpacity={0.7}>
        <View style={styles.userInfo}>
          {post.userAvatar ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
              <Ionicons name="person" size={20} color={tintColor} />
            </View>
          )}
          <View style={styles.userDetails}>
            <ThemedText style={[styles.userName, { color: textColor }]}>
              {post.userName}
            </ThemedText>
            <ThemedText style={[styles.postTime, { color: textColor, opacity: 0.5 }]}>
              {formatRelativeDate(post.createdAt)}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bookInfo}
        onPress={() => onPress?.(post)}
        activeOpacity={0.7}>
        {post.bookCover ? (
          <Image source={{ uri: post.bookCover }} style={styles.bookCover} />
        ) : (
          <View style={[styles.bookCoverPlaceholder, { backgroundColor: separatorColor }]}>
            <Ionicons name="book" size={24} color={textColor} style={{ opacity: 0.3 }} />
          </View>
        )}
        <View style={styles.bookDetails}>
          <ThemedText style={[styles.bookTitle, { color: textColor }]} numberOfLines={1}>
            {post.bookTitle}
          </ThemedText>
          <ThemedText style={[styles.bookAuthor, { color: textColor, opacity: 0.6 }]} numberOfLines={1}>
            {post.bookAuthor}
          </ThemedText>
          {post.rating && renderStars(post.rating)}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.content}
        onPress={() => onPress?.(post)}
        activeOpacity={0.7}>
        <ThemedText style={[styles.postContent, { color: textColor }]}>
          {post.content}
        </ThemedText>
      </TouchableOpacity>

      <View style={[styles.actions, { borderTopColor: separatorColor }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike?.(post)}
          activeOpacity={0.6}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.isLiked ? '#FF3B30' : (isDark ? textColor + '80' : textColor + '60')}
          />
          <ThemedText
            style={[
              styles.actionText,
              {
                color: post.isLiked ? '#FF3B30' : (isDark ? textColor + '80' : textColor + '60'),
              },
            ]}>
            {post.likes}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment?.(post)}
          activeOpacity={0.6}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={isDark ? textColor + '80' : textColor + '60'}
          />
          <ThemedText
            style={[
              styles.actionText,
              { color: isDark ? textColor + '80' : textColor + '60' },
            ]}>
            {post.comments}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  post: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
  },
  bookInfo: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  bookCoverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bookAuthor: {
    fontSize: 14,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

