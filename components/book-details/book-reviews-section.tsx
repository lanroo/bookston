import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { ReviewCard, type ReviewCardData } from '@/components/social/review-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface AppReview {
  id: string;
  userId: string;
  userName: string;
  userUsername?: string;
  userAvatar?: string;
  userInitials: string;
  avatarColor: string;
  rating: number;
  review: string;
  tags: string[];
  likes: number;
  liked: boolean;
  commentsCount?: number;
  createdAt: string;
}

interface BookReviewsSectionProps {
  reviews: AppReview[];
  onToggleLike: (reviewId: string) => void;
  onReviewPress?: (reviewId: string) => void;
  onUserPress?: (userId: string) => void;
  onCommentPress?: (reviewId: string) => void;
  textColor: string;
  tintColor: string;
  isDark?: boolean;
}


export function BookReviewsSection({
  reviews,
  onToggleLike,
  onReviewPress,
  onUserPress,
  onCommentPress,
  textColor,
  tintColor,
  isDark = false,
}: BookReviewsSectionProps) {
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  // Convert AppReview to ReviewCardData
  const convertToReviewCardData = (review: AppReview): ReviewCardData => ({
    id: review.id,
    userId: review.userId,
    userName: review.userName,
    userUsername: review.userUsername,
    userAvatar: review.userAvatar,
    userInitials: review.userInitials,
    avatarColor: review.avatarColor,
    content: review.review,
    rating: review.rating,
    likes: review.likes,
    comments: review.commentsCount,
    isLiked: review.liked,
    createdAt: review.createdAt,
    tags: review.tags,
  });

  return (
    <ThemedView style={styles.section}>
      {/* Section Header */}
      <ThemedView style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
        <ThemedView style={styles.sectionHeaderTop}>
          <ThemedView style={styles.sectionTitleContainer}>
            <Ionicons name="chatbubbles" size={22} color={tintColor} />
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Avaliações e Resenhas
          </ThemedText>
          </ThemedView>
          {reviews.length > 0 && (
            <ThemedView style={[styles.reviewsBadge, { backgroundColor: tintColor + '15' }]}>
              <ThemedText style={[styles.reviewsBadgeText, { color: tintColor }]}>
                {reviews.length}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        
        {reviews.length > 0 && (
          <ThemedView style={styles.statsRow}>
            <ThemedView style={styles.statItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <ThemedText style={[styles.statValue, { color: textColor }]}>
                {averageRating}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: textColor + '60' }]}>
                Média
              </ThemedText>
            </ThemedView>
            <ThemedView style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <ThemedView style={styles.statItem}>
              <Ionicons name="people" size={16} color={tintColor} />
              <ThemedText style={[styles.statValue, { color: textColor }]}>
                {reviews.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: textColor + '60' }]}>
                {reviews.length === 1 ? 'Avaliação' : 'Avaliações'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>

      {reviews.length === 0 ? (
        <ThemedView style={styles.emptyReviewsContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={textColor + '40'} />
          <ThemedText style={[styles.emptyReviewsText, { color: textColor + '80' }]}>
            Ainda não há avaliações
          </ThemedText>
          <ThemedText style={[styles.emptyReviewsSubtext, { color: textColor + '60' }]}>
            Seja o primeiro a avaliar este livro!
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.reviewsContainer}>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={convertToReviewCardData(review)}
              variant="default"
              onPress={(reviewData) => onReviewPress?.(reviewData.id)}
              onLike={(reviewData) => onToggleLike(reviewData.id)}
              onComment={(reviewData) => {
                // Optional: can still navigate if onCommentPress is provided
                // but by default it will just show comments inline
                if (onCommentPress) {
                  // Only navigate if explicitly needed, otherwise show inline
                  // For now, we'll show inline comments
                }
              }}
              onUserPress={onUserPress}
            />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sectionHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  reviewsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reviewsBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
  },
  reviewsContainer: {
    gap: 16,
  },
  emptyReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyReviewsSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});

