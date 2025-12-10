import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SearchService, type SearchResult, type SearchType } from '@/services/search.service';
import { logger } from '@/utils/logger';

interface SearchBarProps {
  onResultPress?: (result: SearchResult) => void;
}

export function SearchBar({ onResultPress }: SearchBarProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    users: SearchResult[];
    books: SearchResult[];
    authors: SearchResult[];
    publishers: SearchResult[];
  }>({
    users: [],
    books: [],
    authors: [],
    publishers: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<SearchType>('all');
  const [pressedButton, setPressedButton] = useState<SearchType | null>(null);

  useEffect(() => {
    if (!searchQuery.trim() || !isSearchModalVisible) {
      setSearchResults({
        users: [],
        books: [],
        authors: [],
        publishers: [],
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedType, isSearchModalVisible]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const types: SearchType[] = selectedType === 'all' ? ['all'] : [selectedType];
      const results = await SearchService.search(searchQuery, types, 10);
      setSearchResults(results);
    } catch (error) {
      logger.error('Error performing search', error, { searchQuery, selectedType });
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    if (onResultPress) {
      onResultPress(result);
    } else {
      // Default navigation behavior
      if (result.type === 'book') {
        // Navigate to book details or add book
        router.push({
          pathname: '/book-details',
          params: { bookId: result.id },
        });
      } else if (result.type === 'user') {
        // Check if it's the current user
        const isCurrentUser = result.metadata?.isCurrentUser;
        if (isCurrentUser) {
          // Navigate to own profile
          router.push('/profile');
        } else {
          // Navigate to other user's profile
          router.push({
            pathname: '/user-profile',
            params: { userId: result.id },
          });
        }
      }
    }
    setIsSearchModalVisible(false);
    setSearchQuery('');
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user':
        return 'person';
      case 'book':
        return 'book';
      case 'author':
        return 'create';
      case 'publisher':
        return 'business';
      default:
        return 'search';
    }
  };

  const renderResultItem = (result: SearchResult) => {
    const isCurrentUser = result.type === 'user' && result.metadata?.isCurrentUser;
    return (
      <TouchableOpacity
        key={result.id}
        style={[
          styles.resultItem,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        ]}
        onPress={() => handleResultPress(result)}
        activeOpacity={0.7}>
        <View style={styles.resultContent}>
          {result.imageUrl ? (
            <Image
              source={{ uri: result.imageUrl }}
              style={styles.resultImage}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.resultIconContainer,
                { backgroundColor: tintColor + '20' },
              ]}>
              <Ionicons name={getResultIcon(result.type) as any} size={24} color={tintColor} />
            </View>
          )}
          <View style={styles.resultTextContainer}>
            <View style={styles.resultTitleRow}>
              <ThemedText style={styles.resultTitle} numberOfLines={1}>
                {result.title}
              </ThemedText>
              {isCurrentUser && (
                <View
                  style={[
                    styles.currentUserBadge,
                    { backgroundColor: tintColor + '20' },
                  ]}>
                  <ThemedText
                    style={[
                      styles.currentUserBadgeText,
                      { color: tintColor },
                    ]}>
                    (eu)
                  </ThemedText>
                </View>
              )}
            </View>
            {result.subtitle && (
              <ThemedText
                style={[styles.resultSubtitle, { color: textColor, opacity: 0.6 }]}
                numberOfLines={1}>
                {result.subtitle}
              </ThemedText>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={textColor} style={{ opacity: 0.3 }} />
        </View>
      </TouchableOpacity>
    );
  };

  const allResults = [
    ...searchResults.users,
    ...searchResults.books,
    ...searchResults.authors,
    ...searchResults.publishers,
  ];

  return (
    <>
      <TouchableOpacity
        style={[
          styles.searchBar,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        ]}
        onPress={() => setIsSearchModalVisible(true)}
        activeOpacity={0.7}>
        <Ionicons name="search" size={20} color={textColor} style={{ opacity: 0.5 }} />
        <ThemedText style={[styles.searchPlaceholder, { color: textColor, opacity: 0.5 }]}>
          Buscar usuários, livros, autores...
        </ThemedText>
      </TouchableOpacity>

      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSearchModalVisible(false)}>
        <ThemedView style={[styles.modalContainer, { backgroundColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: textColor + '10' }]}>
            <View
              style={[
                styles.searchInputContainer,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}>
              <Ionicons name="search" size={20} color={textColor} style={{ opacity: 0.5 }} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Buscar..."
                placeholderTextColor={textColor + '80'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults({
                      users: [],
                      books: [],
                      authors: [],
                      publishers: [],
                    });
                  }}>
                  <Ionicons name="close-circle" size={20} color={textColor} style={{ opacity: 0.5 }} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setIsSearchModalVisible(false)}
              style={styles.closeButton}>
              <ThemedText style={{ color: tintColor, fontWeight: '600' }}>Cancelar</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.filterContainer}>
            {(['all', 'users', 'books', 'authors', 'publishers'] as SearchType[]).map((type) => {
              const isSelected = selectedType === type;
              const isPressed = pressedButton === type;
              // No modo escuro, usar uma cor específica para botões selecionados (não branco)
              const selectedBgColor = isDark ? '#0a7ea4' : tintColor;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: isSelected
                        ? selectedBgColor
                        : isPressed
                          ? isDark
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'rgba(0, 0, 0, 0.1)'
                          : isDark
                            ? 'transparent'
                            : 'rgba(0, 0, 0, 0.05)',
                      borderWidth: isDark && !isSelected ? 1 : 0,
                      borderColor: isDark && !isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    },
                  ]}
                  onPressIn={() => setPressedButton(type)}
                  onPressOut={() => setPressedButton(null)}
                  onPress={() => setSelectedType(type)}
                  activeOpacity={1}>
                  <ThemedText
                    style={[
                      styles.filterText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isPressed
                            ? isDark
                              ? '#FFFFFF'
                              : textColor
                            : isDark
                              ? 'rgba(255, 255, 255, 0.5)'
                              : textColor,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}>
                    {type === 'all'
                      ? 'Tudo'
                      : type === 'users'
                        ? 'Usuários'
                        : type === 'books'
                          ? 'Livros'
                          : type === 'authors'
                            ? 'Autores'
                            : 'Editoras'}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            style={styles.resultsContainer}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : allResults.length > 0 ? (
              allResults.map(renderResultItem)
            ) : searchQuery.trim() ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={textColor} style={{ opacity: 0.3 }} />
                <ThemedText style={[styles.emptyText, { color: textColor, opacity: 0.5 }]}>
                  Nenhum resultado encontrado
                </ThemedText>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={textColor} style={{ opacity: 0.3 }} />
                <ThemedText style={[styles.emptyText, { color: textColor, opacity: 0.5 }]}>
                  Digite para buscar
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: 20,
    gap: 12,
  },
  resultItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
    gap: 4,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentUserBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentUserBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});

