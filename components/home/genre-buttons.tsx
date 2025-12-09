import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface Genre {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: [string, string];
  imageUrl?: string;
}

const GENRES: Genre[] = [
  {
    id: 'romance',
    label: 'Romance',
    icon: 'heart',
    color: '#FF6B9D',
    gradient: ['#FF6B9D', '#FF8EAB'],
  },
  {
    id: 'thriller',
    label: 'Thriller',
    icon: 'flash',
    color: '#FF9500',
    gradient: ['#FF9500', '#FFB340'],
  },
  {
    id: 'ficcao',
    label: 'Ficção',
    icon: 'rocket',
    color: '#5AC8FA',
    gradient: ['#5AC8FA', '#7DD3FF'],
  },
  {
    id: 'fantasia',
    label: 'Fantasia',
    icon: 'sparkles',
    color: '#AF52DE',
    gradient: ['#AF52DE', '#C77AFF'],
  },
  {
    id: 'misterio',
    label: 'Mistério',
    icon: 'search',
    color: '#34C759',
    gradient: ['#34C759', '#5AD373'],
  },
  {
    id: 'biografia',
    label: 'Biografia',
    icon: 'person',
    color: '#0a7ea4',
    gradient: ['#0a7ea4', '#2A9BC4'],
  },
  {
    id: 'historia',
    label: 'História',
    icon: 'book',
    color: '#8E8E93',
    gradient: ['#8E8E93', '#A8A8AD'],
  },
  {
    id: 'poesia',
    label: 'Poesia',
    icon: 'create',
    color: '#FF2D55',
    gradient: ['#FF2D55', '#FF5A7A'],
  },
];

interface GenreButtonsProps {
  selectedGenreId?: string;
  onGenrePress?: (genre: Genre) => void;
}

export function GenreButtons({ selectedGenreId, onGenrePress }: GenreButtonsProps) {
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {GENRES.map((genre) => {
        const isSelected = selectedGenreId === genre.id;
        
        return (
          <View key={genre.id} style={styles.genreButtonWrapper}>
            {isSelected && (
              <View style={[styles.selectedRing, { borderColor: genre.color }]} />
            )}
            <TouchableOpacity
              style={styles.genreButton}
              onPress={() => onGenrePress?.(genre)}
              activeOpacity={0.8}>
              <LinearGradient
                colors={genre.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientContainer}>
                {genre.imageUrl ? (
                  <Image source={{ uri: genre.imageUrl }} style={styles.genreImage} />
                ) : (
                  <View style={styles.iconOverlay}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <Ionicons name={genre.icon} size={28} color="#FFFFFF" />
                </View>
                  </View>
                )}
                <View style={styles.labelContainer}>
                  <ThemedText style={styles.genreLabel}>{genre.label}</ThemedText>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  genreButtonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  selectedRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    opacity: 0.6,
  },
  genreButton: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 42.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  genreImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42.5,
    position: 'absolute',
    opacity: 0.7,
  },
  iconOverlay: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomLeftRadius: 42.5,
    borderBottomRightRadius: 42.5,
  },
  genreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

