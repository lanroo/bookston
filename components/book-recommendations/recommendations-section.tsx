import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { BookRecommendation } from '@/types';

interface RecommendationsSectionProps {
  recommendations: BookRecommendation[];
  isLoading: boolean;
  onBookPress: (book: BookRecommendation) => void;
  title?: string;
}

/**
 * Recommendations Section Component
 * 
 * Displays a horizontal scrollable list of book recommendations.
 */
export function RecommendationsSection({
  recommendations,
  isLoading,
  onBookPress,
  title = 'Recomendado para você',
}: RecommendationsSectionProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={tintColor} />
          <ThemedText style={[styles.loadingText, { color: textColor, opacity: 0.6 }]}>
            Analisando seus gostos...
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerLeft}>
          <ThemedView style={[styles.iconContainer, { backgroundColor: tintColor + '15' }]}>
            <Ionicons name="sparkles" size={20} color={tintColor} />
          </ThemedView>
          <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {recommendations.map((book) => (
          <TouchableOpacity
            key={book.id}
            style={[styles.bookCard, { backgroundColor }]}
            onPress={() => onBookPress(book)}
            activeOpacity={0.7}>
            <ThemedView style={[styles.bookCoverContainer, { backgroundColor: tintColor + '20' }]}>
              {book.coverUrl ? (
                <Image
                  source={{ uri: book.coverUrl }}
                  style={styles.bookCover}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Ionicons name="book" size={32} color={tintColor} />
              )}
            </ThemedView>

            <ThemedView style={styles.bookInfo}>
              <ThemedText style={styles.bookTitle} numberOfLines={2}>
                {book.title}
              </ThemedText>
              <ThemedText style={[styles.bookAuthor, { color: textColor, opacity: 0.7 }]} numberOfLines={1}>
                {book.authors && book.authors.length > 0 ? book.authors[0] : 'Autor desconhecido'}
              </ThemedText>
              {book.reason && (
                <ThemedView style={[styles.reasonBadge, { backgroundColor: tintColor + '15' }]}>
                  <Ionicons name="information-circle" size={12} color={tintColor} />
                  <ThemedText style={[styles.reasonText, { color: tintColor }]} numberOfLines={1}>
                    {book.reason}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bookCard: {
    width: 140,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bookCoverContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  bookInfo: {
    gap: 6,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 12,
    marginBottom: 4,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
});

