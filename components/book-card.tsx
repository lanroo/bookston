
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Book, DragHandleProps } from '@/types';

export interface BookCardProps {
  book: Book;
  isSelected: boolean;
  isDragging: boolean;
  isHoverTarget: boolean;
  selectionMode: boolean;
  backgroundColor: string;
  textColor: string;
  tintColor: string;
  onPress: () => void;
  onLongPress: () => void;
  onOptionsPress: () => void;
  dragHandleProps?: DragHandleProps | null;
  isSwiped?: boolean;
}

/**
 * BookCard Component
 * 
 * Displays a single book card with optional drag handle and selection checkbox.
 * Memoized to prevent unnecessary re-renders when parent state changes.
 * 
 * @param props - BookCard component props
 * @returns Memoized book card component
 */
export const BookCard = React.memo(function BookCard({
  book,
  isSelected,
  isDragging,
  isHoverTarget,
  selectionMode,
  backgroundColor,
  textColor,
  tintColor,
  onPress,
  onLongPress,
  onOptionsPress,
  dragHandleProps,
  isSwiped = false,
}: BookCardProps) {
  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: isSelected ? tintColor : isHoverTarget ? tintColor + '60' : textColor + '10',
          borderWidth: isSelected ? 2 : isHoverTarget ? 2 : 1,
          borderTopRightRadius: isSwiped ? 0 : 16,
          borderBottomRightRadius: isSwiped ? 0 : 16,
        },
      ]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        disabled={isDragging || !!dragHandleProps}>
        {selectionMode && (
          <View style={[styles.checkbox, { borderColor: tintColor }]}>
            {isSelected && (
              <View style={[styles.checkboxInner, { backgroundColor: tintColor }]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
        )}
        {dragHandleProps && (
          <View 
            style={styles.dragHandle} 
            {...(dragHandleProps as any)}>
            <Ionicons
              name="reorder-three-outline"
              size={24}
              color={isDragging ? tintColor : textColor + '60'}
            />
          </View>
        )}
        <View style={[styles.bookCover, { backgroundColor: tintColor + '20' }]}>
          {book.coverUrl ? (
            <Image
              source={{ uri: book.coverUrl }}
              style={styles.bookCoverImage}
              contentFit="cover"
              transition={200}
              placeholderContentFit="cover"
            />
          ) : (
            <Ionicons name="book" size={32} color={tintColor} />
          )}
        </View>
        <View style={styles.bookInfo}>
          <ThemedText style={styles.bookTitle} numberOfLines={2}>
            {book.title}
          </ThemedText>
          <ThemedText style={[styles.bookAuthor, { color: textColor + '80' }]} numberOfLines={1}>
            {book.author}
          </ThemedText>
        </View>
        {!selectionMode && (
          <TouchableOpacity
            style={styles.bookMenu}
            onPress={onOptionsPress}
            onPressIn={(e) => {
              e.stopPropagation();
            }}>
            <Ionicons name="ellipsis-vertical" size={20} color={textColor} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    padding: 12,
    marginLeft: -12,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  bookCover: {
    width: 56,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
  },
  bookMenu: {
    padding: 8,
  },
});

