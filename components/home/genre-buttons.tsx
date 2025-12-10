import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { GhostIcon } from './ghost-icon';
import { HeartIcon } from './heart-icon';

export interface Genre {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: [string, string];
  imageUrl?: string | number;
}

const GENRES: Genre[] = [
  {
    id: 'romance',
    label: 'Romance',
    icon: 'heart',
    color: '#FF6B9D',
    gradient: ['#FF6B9D', '#FF8EAB'],
    imageUrl: require('@/assets/icons/heart1.png'),
  },
  {
    id: 'dark-romance',
    label: 'Dark Romance',
    icon: 'diamond',
    color: '#DC143C',
    gradient: ['#DC143C', '#FF1744'],
    imageUrl: require('@/assets/icons/heartt.png'),
  },
  {
    id: 'fantasia',
    label: 'Fantasia',
    icon: 'sparkles',
    color: '#AF52DE',
    gradient: ['#AF52DE', '#C77AFF'],
  },
  {
    id: 'ficcao',
    label: 'Ficção',
    icon: 'rocket',
    color: '#5AC8FA',
    gradient: ['#5AC8FA', '#7DD3FF'],
  },
  {
    id: 'thriller',
    label: 'Thriller',
    icon: 'cloud',
    color: '#000000',
    gradient: ['#1A1A1A', '#000000'],
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
    color: '#D4A000',
    gradient: ['#D4A000', '#B8860B'],
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
        const isThriller = genre.id === 'thriller';
        const isDarkRomance = genre.id === 'dark-romance';
        const isRomance = genre.id === 'romance';
        const isFiccao = genre.id === 'ficcao';
        
        return (
          <View key={genre.id} style={styles.genreButtonWrapper}>
            <View style={styles.genreItemContainer}>
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
                    <View style={styles.iconOverlay}>
                      <View style={[
                        styles.iconContainer, 
                        { 
                          backgroundColor: (isDarkRomance || isRomance) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                          borderColor: (isDarkRomance || isRomance) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                        }
                      ]}>
                        {isRomance ? (
                          <View style={styles.heartOutlineWrapper}>
                            {/* Black outline layer */}
                            <Image 
                              source={typeof genre.imageUrl === 'number' ? genre.imageUrl : { uri: genre.imageUrl }} 
                              style={[styles.genreImageIcon, styles.heartOutlineBlack]} 
                              resizeMode="contain"
                            />
                            {/* White heart on top */}
                            <Image 
                              source={typeof genre.imageUrl === 'number' ? genre.imageUrl : { uri: genre.imageUrl }} 
                              style={[styles.genreImageIcon, styles.heartOutlineWhite]} 
                              resizeMode="contain"
                            />
                          </View>
                        ) : isDarkRomance ? (
                          <View style={styles.heartOutlineWrapper}>
                            {/* Black outline layer */}
                            <Image 
                              source={typeof genre.imageUrl === 'number' ? genre.imageUrl : { uri: genre.imageUrl }} 
                              style={[styles.genreImageIcon, styles.heartOutlineBlack]} 
                              resizeMode="contain"
                            />
                            {/* White image on top */}
                            <Image 
                              source={typeof genre.imageUrl === 'number' ? genre.imageUrl : { uri: genre.imageUrl }} 
                              style={[styles.genreImageIcon, styles.heartOutlineWhite]} 
                              resizeMode="contain"
                            />
                          </View>
                        ) : (
                          <Image 
                            source={typeof genre.imageUrl === 'number' ? genre.imageUrl : { uri: genre.imageUrl }} 
                            style={styles.genreImageIcon} 
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.iconOverlay}>
                      <View style={[
                        styles.iconContainer, 
                        { 
                          backgroundColor: isThriller ? 'rgba(255, 255, 255, 0.15)' : isDarkRomance ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                          borderColor: isThriller ? 'rgba(255, 255, 255, 0.2)' : isDarkRomance ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                        }
                      ]}>
                        {isThriller ? (
                          <GhostIcon size={32} color="#FFFFFF" />
                        ) : isRomance ? (
                          <HeartIcon size={32} color="#FFFFFF" />
                        ) : isDarkRomance ? (
                          <HeartIcon size={32} color="#FFFFFF" />
                        ) : (
                          <View style={styles.iconOutlineWrapper}>
                            {/* Black outline layer */}
                            <Ionicons name={genre.icon} size={32} color="#000000" style={styles.iconOutlineBlack} />
                            {/* White icon on top */}
                            <Ionicons name={genre.icon} size={28} color="#FFFFFF" style={styles.iconOutlineWhite} />
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <ThemedText style={styles.genreLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {genre.label}
              </ThemedText>
            </View>
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
    top: -7.5,
    alignSelf: 'center',
    zIndex: -1,
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
    width: '80%',
    height: '80%',
    borderRadius: 42.5,
    position: 'absolute',
    opacity: 1,
    tintColor: '#FFFFFF',
  },
  genreImageIcon: {
    width: 54,
    height: 54,
    tintColor: '#FFFFFF',
  },
  heartOutlineWrapper: {
    position: 'relative',
    width: 54,
    height: 54,
  },
  heartOutlineBlack: {
    position: 'absolute',
    tintColor: '#000000',
    width: 58,
    height: 58,
    top: -2,
    left: -2,
  },
  heartOutlineWhite: {
    position: 'absolute',
    tintColor: '#FFFFFF',
    top: 0,
    left: 0,
  },
  iconOutlineWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOutlineBlack: {
    position: 'absolute',
    top: -1,
    left: -1,
  },
  iconOutlineWhite: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  genreItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  genreLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 85,
  },
});

