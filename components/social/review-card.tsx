import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { CommentSection } from '@/components/social/comment-section';
import { PointsDisplay } from '@/components/social/points-display';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface ReviewCardData {
  id: string;
  userId: string;
  userName: string;
  userUsername?: string;
  userAvatar?: string;
  userInitials?: string;
  avatarColor?: string;
  content: string;
  rating?: number;
  likes: number;
  comments?: number;
  isLiked?: boolean;
  createdAt: string;
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string; 
  tags?: string[];
}

export interface ReviewCardProps {
  review: ReviewCardData;
  currentUserId?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showBookInfo?: boolean;
  showComments?: boolean;
  onPress?: (review: ReviewCardData) => void;
  onBookPress?: (review: ReviewCardData) => void;
  onLike?: (review: ReviewCardData) => void;
  onComment?: (review: ReviewCardData) => void;
  onUserPress?: (userId: string) => void;
  onOptions?: (review: ReviewCardData) => void;
}

export function ReviewCard({
  review,
  currentUserId,
  variant = 'default',
  showBookInfo = false,
  showComments = false,
  onPress,
  onBookPress,
  onLike,
  onComment,
  onUserPress,
  onOptions,
}: ReviewCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const relativeTime = useRelativeTime(review.createdAt);

  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [localShowComments, setLocalShowComments] = useState(showComments);

  useEffect(() => {
    setLocalShowComments(showComments);
  }, [showComments, review.id]);

  const isOwnReview = currentUserId && review.userId === currentUserId;
  const separatorColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const initials = review.userInitials || 
    (review.userName
      ? review.userName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U');

  const avatarColor = review.avatarColor || (() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#AA96DA', '#F38181', '#FCE38A', '#EAFFD0'];
    const colorIndex = review.userId.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  })();

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={variant === 'compact' ? 12 : 14}
            color={tintColor}
          />
        ))}
      </View>
    );
  };

  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <ThemedView
      style={[
        styles.card,
        isCompact && styles.cardCompact,
        isDetailed && styles.cardDetailed,
        {
          borderColor: separatorColor,
          backgroundColor,
        },
      ]}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.userInfoContainer}
          onPress={() => onUserPress?.(review.userId)}
          activeOpacity={0.7}
          disabled={!onUserPress}>
          <View style={styles.userInfo}>
            {review.userAvatar && !avatarLoadError ? (
              <Image
                source={{
                  uri: review.userAvatar.includes('?t=')
                    ? review.userAvatar
                    : `${review.userAvatar}?t=${Date.now()}`,
                }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
                placeholderContentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={review.userAvatar}
                onError={() => setAvatarLoadError(true)}
                onLoad={() => setAvatarLoadError(false)}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
                <Ionicons name="person" size={20} color={tintColor} />
              </View>
            )}
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <View style={styles.userNameContainer}>
                  <ThemedText style={[styles.userName, { color: textColor }]}>
                    {review.userName}
                  </ThemedText>
                  {review.userUsername && (
                    <ThemedText style={[styles.userUsername, { color: textColor, opacity: 0.5 }]}>
                      @{review.userUsername}
                    </ThemedText>
                  )}
                </View>
                <PointsDisplay userId={review.userId} compact showLevel={false} />
              </View>
              <ThemedText style={[styles.postTime, { color: textColor, opacity: 0.5 }]}>
                {relativeTime}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
        {isOwnReview && onOptions && (
          <TouchableOpacity
            style={[styles.optionsButton, { backgroundColor: textColor + '08' }]}
            onPress={() => onOptions(review)}
            activeOpacity={0.6}>
            <Ionicons name="ellipsis-vertical" size={18} color={textColor} />
          </TouchableOpacity>
        )}
      </View>

      {(review.bookTitle || review.bookCover) && (
        <TouchableOpacity
          style={[styles.bookInfo, isCompact && styles.bookInfoCompact]}
          onPress={() => {
            if (onBookPress) {
              onBookPress(review);
            } else {
              onPress?.(review);
            }
          }}
          activeOpacity={0.7}
          disabled={!onBookPress && !onPress}>
          {review.bookCover ? (
            <Image source={{ uri: review.bookCover }} style={styles.bookCover} />
          ) : (
            <View style={[styles.bookCoverPlaceholder, { backgroundColor: separatorColor }]}>
              <Ionicons name="book" size={isCompact ? 20 : 24} color={textColor} style={{ opacity: 0.3 }} />
            </View>
          )}
          {(review.bookTitle || review.bookAuthor) && (
            <View style={styles.bookDetails}>
              {review.bookTitle && (
                <ThemedText
                  style={[styles.bookTitle, isCompact && styles.bookTitleCompact, { color: textColor }]}
                  numberOfLines={1}>
                  {review.bookTitle}
                </ThemedText>
              )}
              {review.bookAuthor && (
                <ThemedText
                  style={[
                    styles.bookAuthor,
                    isCompact && styles.bookAuthorCompact,
                    { color: textColor, opacity: 0.6 },
                  ]}
                  numberOfLines={1}>
                  {review.bookAuthor}
                </ThemedText>
              )}
              {review.rating && review.rating > 0 && (
                <View style={styles.bookRating}>
                  {renderStars(review.rating)}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.content, isCompact && styles.contentCompact]}
        onPress={() => onPress?.(review)}
        activeOpacity={0.7}
        disabled={!onPress}
        delayPressIn={100}>
        <ThemedText
          style={[
            styles.reviewText,
            isCompact && styles.reviewTextCompact,
            { color: textColor },
          ]}
          numberOfLines={isCompact ? 2 : isDetailed ? undefined : 4}>
          {review.content}
        </ThemedText>
        {review.tags && review.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {review.tags.map((tag, index) => (
              <ThemedView
                key={index}
                style={[styles.tag, { backgroundColor: tintColor + '15' }]}>
                <ThemedText style={[styles.tagText, { color: tintColor }]}>
                  {tag}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <View style={[styles.actions, { borderTopColor: separatorColor }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onLike?.(review);
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View
            style={[
              styles.actionIconContainer,
              { backgroundColor: review.isLiked ? '#FF6B6B' + '15' : 'transparent' },
            ]}>
            <Ionicons
              name={review.isLiked ? 'heart' : 'heart-outline'}
              size={isCompact ? 16 : 18}
              color={review.isLiked ? '#FF6B6B' : textColor + '60'}
            />
          </View>
          <ThemedText
            style={[
              styles.actionText,
              isCompact && styles.actionTextCompact,
              {
                color: review.isLiked ? '#FF6B6B' : textColor + '70',
              },
            ]}>
            {review.likes ?? 0}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setLocalShowComments((prev) => !prev);
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View
            style={[
              styles.actionIconContainer,
              { backgroundColor: localShowComments ? tintColor + '15' : 'transparent' },
            ]}>
            <Ionicons
              name={localShowComments ? 'chatbubble' : 'chatbubble-outline'}
              size={isCompact ? 16 : 18}
              color={localShowComments ? tintColor : textColor + '60'}
            />
          </View>
          <ThemedText
            style={[
              styles.actionText,
              isCompact && styles.actionTextCompact,
              { color: localShowComments ? tintColor : textColor + '70' },
            ]}>
            {review.comments ?? 0}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {localShowComments && (
        <CommentSection
          postId={review.id}
          onCommentAdded={() => {
            onComment?.(review);
          }}
          onUserPress={onUserPress}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardCompact: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardDetailed: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  userInfoContainer: {
    flex: 1,
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
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  userNameCompact: {
    fontSize: 14,
  },
  userUsername: {
    fontSize: 13,
    fontWeight: '400',
  },
  userUsernameCompact: {
    fontSize: 12,
  },
  postTime: {
    fontSize: 13,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  bookInfo: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  bookInfoCompact: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
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
  bookTitleCompact: {
    fontSize: 14,
  },
  bookAuthor: {
    fontSize: 14,
  },
  bookAuthorCompact: {
    fontSize: 12,
  },
  bookRating: {
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contentCompact: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
  },
  reviewTextCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
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
    gap: 8,
    padding: 4,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionTextCompact: {
    fontSize: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
});

