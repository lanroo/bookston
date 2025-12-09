import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { InteractiveRating } from '@/components/interactive-rating';
import type { Book } from '@/types';

interface BookDetailsHeaderProps {
  book: Book;
  coverUrl?: string;
  userRating?: number;
  savingRating: boolean;
  onRatingChange: (rating: number) => void;
  backgroundColor: string;
  textColor: string;
  tintColor: string;
}

export function BookDetailsHeader({
  book,
  coverUrl,
  userRating,
  savingRating,
  onRatingChange,
  backgroundColor,
  textColor,
  tintColor,
}: BookDetailsHeaderProps) {
  return (
    <ThemedView style={styles.bookHeader}>
      <ThemedView style={[styles.coverContainer, { backgroundColor: tintColor + '20' }]}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Ionicons name="book" size={64} color={tintColor} />
        )}
      </ThemedView>

      <ThemedView style={styles.basicInfo}>
        <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={3}>
          {book.title}
        </ThemedText>
        <ThemedText style={[styles.author, { color: textColor + '80' }]} numberOfLines={2}>
          {book.author}
        </ThemedText>

        <ThemedView style={styles.ratingSection}>
          <ThemedText style={[styles.ratingLabel, { color: textColor + '80' }]}>
            Sua avaliação:
          </ThemedText>
          <InteractiveRating
            rating={userRating || 0}
            onRatingChange={onRatingChange}
            saving={savingRating}
            size={28}
          />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  coverContainer: {
    width: 120,
    height: 180,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  basicInfo: {
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  author: {
    fontSize: 16,
    fontWeight: '500',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
});

