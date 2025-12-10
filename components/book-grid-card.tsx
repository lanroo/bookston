import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Book } from '@/types';

export interface BookGridCardProps {
  book: Book;
  isSelected: boolean;
  selectionMode: boolean;
  backgroundColor: string;
  textColor: string;
  tintColor: string;
  onPress: () => void;
  onLongPress: () => void;
  onOptionsPress: () => void;
}

/**
 * BookGridCard Component
 * 
 * Componente isolado especificamente para visualização em grade de livros.
 * Não compartilha lógica com BookCard para evitar conflitos.
 */
export const BookGridCard = React.memo(function BookGridCard({
  book,
  isSelected,
  selectionMode,
  backgroundColor,
  textColor,
  tintColor,
  onPress,
  onLongPress,
  onOptionsPress,
}: BookGridCardProps) {
  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: isSelected ? tintColor : textColor + '10',
          borderWidth: isSelected ? 2 : 1,
        },
      ]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}>
        {selectionMode && (
          <View
            style={[
              styles.checkbox,
              {
                borderColor: tintColor,
                backgroundColor: backgroundColor + 'F0',
              },
            ]}>
            {isSelected && (
              <View style={[styles.checkboxInner, { backgroundColor: tintColor }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </View>
        )}
        <View style={[styles.cover, { backgroundColor: tintColor + '20' }]}>
          {book.coverUrl ? (
            <Image
              source={{ uri: book.coverUrl }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
              placeholderContentFit="cover"
            />
          ) : (
            <Ionicons name="book" size={48} color={tintColor} />
          )}
          {!selectionMode && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onOptionsPress}
              onPressIn={(e) => {
                e.stopPropagation();
              }}
              activeOpacity={0.7}>
              <View style={styles.menuButtonBackground}>
                <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.info}>
          <ThemedText style={styles.title} numberOfLines={2}>
            {book.title}
          </ThemedText>
          <ThemedText style={[styles.author, { color: textColor + '80' }]} numberOfLines={1}>
            {book.author}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    width: '100%',
    position: 'relative',
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 8,
    zIndex: 10,
    overflow: 'hidden',
  },
  menuButtonBackground: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cover: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    width: '100%',
    padding: 12,
    paddingTop: 10,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    width: '100%',
  },
  author: {
    fontSize: 11,
    textAlign: 'center',
    width: '100%',
  },
});

