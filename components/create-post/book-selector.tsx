import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecommendationsSection } from '@/components/book-recommendations';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { useAuth } from '@/contexts/AuthContext';
import { useBookRecommendations } from '@/hooks/use-book-recommendations';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BookSearchService } from '@/services/book-search.service';
import { BooksService } from '@/services/books.service';
import type { Book, BookRecommendation, BookSearchResult } from '@/types';
import { logger } from '@/utils/logger';

interface BookSelectorProps {
  visible: boolean;
  onClose: () => void;
  onBookSelect: (book: BookSearchResult | BookRecommendation) => void;
}

export function BookSelector({ visible, onClose, onBookSelect }: BookSelectorProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loadingUserBooks, setLoadingUserBooks] = useState(false);
  const { recommendations, isLoading: recommendationsLoading } = useBookRecommendations(10);

  const loadUserBooks = useCallback(async () => {
    if (!user) return;

    setLoadingUserBooks(true);
    try {
      const books = await BooksService.getBooks();
      setUserBooks(books);
    } catch (error) {
      logger.error('Error loading user books', error);
    } finally {
      setLoadingUserBooks(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible && user) {
      loadUserBooks();
    }
  }, [visible, user, loadUserBooks]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchBooks(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchBooks = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const results = await BookSearchService.searchBooks(query, 20);
      setSearchResults(results);
    } catch (error: unknown) {
      logger.error('Error searching books', error, { query });
      Alert.alert('Erro', 'Não foi possível buscar livros. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (book: BookSearchResult | BookRecommendation) => {
    onBookSelect(book);
    onClose();
  };

  const handleUserBookPress = (book: Book) => {
    const bookResult: BookSearchResult = {
      id: book.id,
      title: book.title,
      authors: [book.author],
      coverUrl: book.coverUrl,
      source: 'user-library',
    };
    onBookSelect(bookResult);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Selecionar Livro
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <ThemedTextInput
            placeholder="Buscar livros..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoFocus={false}
          />
          {loading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={tintColor} />
            </View>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {!searchQuery.trim() && (
            <>
              <View style={styles.userBooksSection}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: tintColor + '15' }]}>
                    <Ionicons name="library" size={20} color={tintColor} />
                  </View>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Meus Livros
                  </ThemedText>
                </View>
                {loadingUserBooks ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={tintColor} />
                    <ThemedText style={[styles.loadingText, { color: textColor, opacity: 0.6 }]}>
                      Carregando seus livros...
                    </ThemedText>
                  </View>
                ) : userBooks.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.userBooksScroll}>
                    {userBooks.map((book) => (
                      <TouchableOpacity
                        key={book.id}
                        style={[styles.userBookCard, { backgroundColor, borderColor: textColor + '10' }]}
                        onPress={() => handleUserBookPress(book)}
                        activeOpacity={0.7}>
                        {book.coverUrl ? (
                          <Image source={{ uri: book.coverUrl }} style={styles.userBookCover} contentFit="cover" />
                        ) : (
                          <View style={[styles.userBookCoverPlaceholder, { backgroundColor: textColor + '10' }]}>
                            <Ionicons name="book" size={24} color={textColor} style={{ opacity: 0.3 }} />
                          </View>
                        )}
                        <View style={styles.userBookInfo}>
                          <ThemedText style={[styles.userBookTitle, { color: textColor }]} numberOfLines={2}>
                            {book.title}
                          </ThemedText>
                          <ThemedText
                            style={[styles.userBookAuthor, { color: textColor, opacity: 0.6 }]}
                            numberOfLines={1}>
                            {book.author}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyUserBooks}>
                    <Ionicons name="library-outline" size={32} color={textColor} style={{ opacity: 0.3 }} />
                    <ThemedText style={[styles.emptyUserBooksText, { color: textColor, opacity: 0.5 }]}>
                      Você ainda não tem livros adicionados
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.recommendationsWrapper}>
                <RecommendationsSection
                  recommendations={recommendations}
                  isLoading={recommendationsLoading}
                  onBookPress={handleBookPress}
                  title="Recomendado para você"
                />
              </View>
            </>
          )}

          {searchQuery.trim() && searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <ThemedText style={[styles.resultsTitle, { color: textColor }]}>
                Resultados da busca
              </ThemedText>
              {searchResults.map((book) => (
                <TouchableOpacity
                  key={book.id}
                  style={[styles.bookItem, { backgroundColor, borderColor: textColor + '10' }]}
                  onPress={() => handleBookPress(book)}
                  activeOpacity={0.7}>
                  {book.coverUrl ? (
                    <Image source={{ uri: book.coverUrl }} style={styles.bookCover} contentFit="cover" />
                  ) : (
                    <View style={[styles.bookCoverPlaceholder, { backgroundColor: textColor + '10' }]}>
                      <Ionicons name="book" size={24} color={textColor} style={{ opacity: 0.3 }} />
                    </View>
                  )}
                  <View style={styles.bookInfo}>
                    <ThemedText style={[styles.bookTitle, { color: textColor }]} numberOfLines={2}>
                      {book.title}
                    </ThemedText>
                    <ThemedText
                      style={[styles.bookAuthor, { color: textColor, opacity: 0.6 }]}
                      numberOfLines={1}>
                      {book.authors.join(', ')}
                    </ThemedText>
                    {book.description && (
                      <ThemedText
                        style={[styles.bookDescription, { color: textColor, opacity: 0.5 }]}
                        numberOfLines={2}>
                        {book.description}
                      </ThemedText>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={textColor} style={{ opacity: 0.3 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searchQuery.trim() && !loading && searchResults.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={textColor} style={{ opacity: 0.3 }} />
              <ThemedText style={[styles.emptyStateText, { color: textColor, opacity: 0.5 }]}>
                Nenhum livro encontrado
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'relative',
  },
  searchInput: {
    marginBottom: 0,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 32,
    top: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  recommendationsWrapper: {
    paddingHorizontal: 0,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  bookItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  bookCover: {
    width: 50,
    height: 75,
    borderRadius: 6,
  },
  bookCoverPlaceholder: {
    width: 50,
    height: 75,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  bookAuthor: {
    fontSize: 13,
  },
  bookDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 15,
    textAlign: 'center',
  },
  userBooksSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
  },
  userBooksScroll: {
    gap: 12,
    paddingRight: 20,
  },
  userBookCard: {
    width: 140,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  userBookCover: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
  },
  userBookCoverPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBookInfo: {
    gap: 4,
  },
  userBookTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  userBookAuthor: {
    fontSize: 12,
  },
  emptyUserBooks: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyUserBooksText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

