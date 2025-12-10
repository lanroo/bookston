import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SearchService, type SearchResult, type SearchType } from '@/services/search.service';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.95)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

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
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedType, isSearchModalVisible]);

  useEffect(() => {
    if (isSearchModalVisible) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScale.setValue(0.95);
      modalOpacity.setValue(0);
    }
  }, [isSearchModalVisible]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const types: SearchType[] = selectedType === 'all' ? ['all'] : [selectedType];
      const results = await SearchService.search(searchQuery, types, 15);
      setSearchResults(results);
      logger.debug('Search results', { 
        query: searchQuery, 
        usersCount: results.users.length,
        booksCount: results.books.length,
        authorsCount: results.authors.length,
        publishersCount: results.publishers.length,
      });
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
      if (result.type === 'user') {
        const isCurrentUser = result.metadata?.isCurrentUser;
        if (isCurrentUser) {
          router.push('/profile');
        } else {
          router.push({
            pathname: '/user-profile',
            params: { userId: result.id },
          });
        }
      }
      // TODO: Add navigation for books when book-details route is available
    }
    setIsSearchModalVisible(false);
    setSearchQuery('');
  };

  const handleCloseModal = () => {
    setIsSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults({
      users: [],
      books: [],
      authors: [],
      publishers: [],
    });
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

  const getTypeLabel = (type: SearchType) => {
    switch (type) {
      case 'all':
        return 'Tudo';
      case 'users':
        return 'Pessoas';
      case 'books':
        return 'Livros';
      case 'authors':
        return 'Autores';
      case 'publishers':
        return 'Editoras';
    }
  };

  const renderResultItem = (result: SearchResult, index: number) => {
    const isCurrentUser = result.type === 'user' && result.metadata?.isCurrentUser;
    
    return (
      <TouchableOpacity
        key={`${result.id}-${index}`}
        style={[
          styles.resultItem,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
          },
        ]}
        onPress={() => handleResultPress(result)}
        activeOpacity={0.5}
        delayPressIn={0}>
        {result.imageUrl ? (
          <Image
            source={{ uri: result.imageUrl }}
            style={[
              styles.resultImage,
              result.type === 'user' && styles.resultImageRound,
            ]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.resultIconContainer,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : tintColor + '12' },
              result.type === 'user' && styles.resultImageRound,
            ]}>
            <Ionicons 
              name={getResultIcon(result.type) as any} 
              size={20} 
              color={isDark ? 'rgba(255, 255, 255, 0.6)' : tintColor} 
            />
          </View>
        )}
        <View style={styles.resultTextContainer}>
          <View style={styles.resultTitleRow}>
            <ThemedText style={styles.resultTitle} numberOfLines={1}>
              {result.title}
            </ThemedText>
            {isCurrentUser && (
              <View style={[styles.youBadge, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.youBadgeText}>você</ThemedText>
              </View>
            )}
          </View>
          {result.subtitle && (
            <ThemedText
              style={[styles.resultSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}
              numberOfLines={1}>
              {result.subtitle}
            </ThemedText>
          )}
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} 
        />
      </TouchableOpacity>
    );
  };

  const allResults = [
    ...searchResults.users,
    ...searchResults.books,
    ...searchResults.authors,
    ...searchResults.publishers,
  ];

  const filterTypes: SearchType[] = ['all', 'users', 'books', 'authors', 'publishers'];

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.searchButton,
            {
              backgroundColor: isDark 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark 
                ? 'rgba(255, 255, 255, 0.12)' 
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
          onPress={() => setIsSearchModalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}>
          <Ionicons
            name="search"
            size={18}
            color={isDark ? 'rgba(255, 255, 255, 0.7)' : tintColor}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Search Modal */}
      <Modal
        visible={isSearchModalVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}>
            {/* Search Input */}
            <View style={styles.searchHeader}>
              <View
                style={[
                  styles.searchInputWrapper,
                  {
                    backgroundColor: isDark 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}>
                <Ionicons
                  name="search"
                  size={18}
                  color={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: textColor },
                  ]}
                  placeholder="Buscar pessoas, livros, autores..."
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <View style={[
                      styles.clearButton,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)' }
                    ]}>
                      <Ionicons 
                        name="close" 
                        size={12} 
                        color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'} 
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.cancelButton}>
                <ThemedText style={[styles.cancelText, { color: tintColor }]}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
              style={styles.filterScroll}>
              {filterTypes.map((type) => {
                const isSelected = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedType(type)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected
                          ? tintColor
                          : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}
                    activeOpacity={0.7}>
                    <ThemedText
                      style={[
                        styles.filterPillText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : isDark
                              ? 'rgba(255, 255, 255, 0.6)'
                              : 'rgba(0, 0, 0, 0.6)',
                        },
                      ]}>
                      {getTypeLabel(type)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[
              styles.divider,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }
            ]} />

            <ScrollView
              style={styles.resultsContainer}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none">
              {loading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={tintColor} />
                  <ThemedText style={[
                    styles.loadingText,
                    { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }
                  ]}>
                    Buscando...
                  </ThemedText>
                </View>
              ) : allResults.length > 0 ? (
                <View style={styles.resultsList}>
                  {allResults.map((result, index) => renderResultItem(result, index))}
                </View>
              ) : searchQuery.trim() ? (
                <View style={styles.centerContainer}>
                  <View style={[
                    styles.emptyIconContainer,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)' }
                  ]}>
                    <Ionicons 
                      name="search-outline" 
                      size={32} 
                      color={isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'} 
                    />
                  </View>
                  <ThemedText style={[
                    styles.emptyText,
                    { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }
                  ]}>
                    Nenhum resultado para "{searchQuery}"
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.centerContainer}>
                  <View style={[
                    styles.emptyIconContainer,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)' }
                  ]}>
                    <Ionicons 
                      name="sparkles-outline" 
                      size={32} 
                      color={isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'} 
                    />
                  </View>
                  <ThemedText style={[
                    styles.emptyText,
                    { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }
                  ]}>
                    O que você está procurando?
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    marginHorizontal: 12,
    borderRadius: 20,
    height: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },

  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 16,
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },

  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    marginHorizontal: 12,
  },

  resultsContainer: {
    flex: 1,
    minHeight: 200,
  },
  resultsContent: {
    padding: 12,
    paddingTop: 8,
    paddingBottom: 20,
    flexGrow: 1,
  },
  resultsList: {
    gap: 6,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 14,
    minHeight: 72,
  },
  resultImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  resultImageRound: {
    borderRadius: 22,
  },
  resultIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
    gap: 2,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultSubtitle: {
    fontSize: 13,
    letterSpacing: -0.1,
  },

  centerContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
