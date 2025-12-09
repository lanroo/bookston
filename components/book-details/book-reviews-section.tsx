import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface AppReview {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  avatarColor: string;
  rating: number;
  review: string;
  tags: string[];
  likes: number;
  liked: boolean;
  createdAt: string;
}

interface BookReviewsSectionProps {
  reviews: AppReview[];
  onToggleLike: (reviewId: string) => void;
  textColor: string;
  tintColor: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'agora';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  if (diffInSeconds < 2592000) return `há ${Math.floor(diffInSeconds / 604800)} semanas`;
  if (diffInSeconds < 31536000) return `há ${Math.floor(diffInSeconds / 2592000)} meses`;
  return `há ${Math.floor(diffInSeconds / 31536000)} anos`;
}

function renderStars(rating: number, textColor: string) {
  return (
    <ThemedView style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={14}
          color={star <= rating ? '#FFD700' : textColor + '40'}
        />
      ))}
    </ThemedView>
  );
}

export function BookReviewsSection({
  reviews,
  onToggleLike,
  textColor,
  tintColor,
}: BookReviewsSectionProps) {
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.reviewsHeader}>
        <ThemedView style={styles.reviewsHeaderTop}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Avaliações e Resenhas
          </ThemedText>
          {reviews.length > 0 && (
            <ThemedView style={styles.reviewsStats}>
              <ThemedView style={styles.reviewsStatsItem}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <ThemedText style={[styles.reviewsStatsText, { color: textColor }]}>
                  {averageRating}
                </ThemedText>
              </ThemedView>
              <ThemedText style={[styles.reviewsStatsText, { color: textColor + '70' }]}>
                • {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
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
            <ThemedView key={review.id} style={styles.reviewCard}>
              <ThemedView style={styles.reviewHeader}>
                <ThemedView style={styles.reviewAuthorInfo}>
                  <ThemedView
                    style={[
                      styles.reviewAvatar,
                      { backgroundColor: review.avatarColor + '30' },
                    ]}>
                    <ThemedText
                      style={[styles.reviewAvatarText, { color: review.avatarColor }]}>
                      {review.userInitials}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.reviewAuthorDetails}>
                    <ThemedText style={[styles.reviewAuthorName, { color: textColor }]}>
                      {review.userName}
                    </ThemedText>
                    <ThemedView style={styles.reviewMeta}>
                      {renderStars(review.rating, textColor)}
                      <ThemedText style={[styles.reviewDate, { color: textColor + '60' }]}>
                        • {formatTimeAgo(review.createdAt)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
                <ThemedView style={styles.reviewActions}>
                  <TouchableOpacity
                    style={styles.reviewActionButton}
                    onPress={() => onToggleLike(review.id)}>
                    <Ionicons
                      name={review.liked ? 'heart' : 'heart-outline'}
                      size={18}
                      color={review.liked ? '#FF6B6B' : textColor + '60'}
                    />
                    <ThemedText
                      style={[
                        styles.reviewActionText,
                        { color: review.liked ? '#FF6B6B' : textColor + '60' },
                      ]}>
                      {review.likes}
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
              <ThemedText style={[styles.reviewText, { color: textColor + '90' }]}>
                {review.review}
              </ThemedText>
              {review.tags.length > 0 && (
                <ThemedView style={styles.reviewTags}>
                  {review.tags.map((tag, index) => (
                    <ThemedView
                      key={index}
                      style={[styles.reviewTag, { backgroundColor: tintColor + '20' }]}>
                      <ThemedText style={[styles.reviewTagText, { color: tintColor }]}>
                        {tag}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          ))}

          <TouchableOpacity style={styles.viewMoreButton}>
            <ThemedText style={[styles.viewMoreText, { color: tintColor }]}>
              Ver mais avaliações
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color={tintColor} />
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  reviewsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  reviewsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewsStatsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsStatsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewsContainer: {
    gap: 12,
  },
  reviewCard: {
    padding: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewAuthorDetails: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  reviewDate: {
    fontSize: 11,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  reviewActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
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
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
});

