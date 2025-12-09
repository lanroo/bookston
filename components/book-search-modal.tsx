import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecommendationsSection } from '@/components/book-recommendations';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useBookRecommendations } from '@/hooks/use-book-recommendations';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BookSearchService } from '@/services/book-search.service';
import { BooksService } from '@/services/books.service';
import type { BookRecommendation, BookSearchResult, BookStatus } from '@/types';
import { logger } from '@/utils/logger';

interface BookSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onBookAdded: () => void;
  defaultStatus?: BookStatus;
}

export function BookSearchModal({
  visible,
  onClose,
  onBookAdded,
  defaultStatus = 'want-to-read',
}: BookSearchModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingBook, setAddingBook] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<(BookSearchResult | BookRecommendation) | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>(defaultStatus);

  const { recommendations, isLoading: recommendationsLoading } = useBookRecommendations(10);

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
    Keyboard.dismiss();
    setSelectedBook(book);
    setSelectedStatus(defaultStatus);
  };

  const handleConfirmAdd = async () => {
    if (!selectedBook) return;

    setAddingBook(selectedBook.id);
    try {
      await BooksService.createBook({
        title: selectedBook.title,
        author: selectedBook.authors.join(', '),
        status: selectedStatus,
        coverUrl: selectedBook.coverUrl,
        notes: selectedBook.description
          ? selectedBook.description.substring(0, 500) // Limitar descrição
          : undefined,
      });

      Alert.alert('Sucesso', 'Livro adicionado com sucesso!');
      onBookAdded();
      handleClose();
    } catch (error) {
      logger.error('Error adding book', error, { bookTitle: selectedBook.title });
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível adicionar o livro: ${errorMessage}`);
    } finally {
      setAddingBook(null);
      setSelectedBook(null);
    }
  };

  const handleCancelSelection = () => {
    setSelectedBook(null);
    setSelectedStatus(defaultStatus);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedBook(null);
    setSelectedStatus(defaultStatus);
    onClose();
  };

  const statusOptions: { id: BookStatus; label: string; icon: string }[] = [
    { id: 'want-to-read', label: 'Quero Ler', icon: 'bookmark-outline' },
    { id: 'reading', label: 'Lendo', icon: 'book-outline' },
    { id: 'read', label: 'Já Li', icon: 'checkmark-circle-outline' },
    { id: 'rereading', label: 'Relendo', icon: 'refresh-outline' },
  ];


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>
              Buscar Livro
            </ThemedText>
            <ThemedView style={styles.closeButton} />
          </ThemedView>

          {/* Search Input */}
          <ThemedView style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={textColor} style={styles.searchIcon} />
            <ThemedTextInput
              style={styles.searchInput}
              placeholder="Digite o nome do livro..."
              placeholderTextColor={textColor + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={textColor + '60'} />
              </TouchableOpacity>
            )}
          </ThemedView>

          {/* Results */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {!searchQuery.trim() && (
              <RecommendationsSection
                recommendations={recommendations}
                isLoading={recommendationsLoading}
                onBookPress={handleBookPress}
                title="Recomendado para você"
              />
            )}
            
            {loading ? (
              <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tintColor} />
                <ThemedText style={[styles.loadingText, { color: textColor + '80' }]}>
                  Buscando livros...
                </ThemedText>
              </ThemedView>
            ) : searchResults.length === 0 && searchQuery.trim() ? (
              <ThemedView style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={64} color={textColor + '40'} />
                <ThemedText style={[styles.emptyText, { color: textColor + '80' }]}>
                  Nenhum livro encontrado
                </ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: textColor + '60' }]}>
                  Tente buscar com outro termo
                </ThemedText>
              </ThemedView>
            ) : searchResults.length === 0 ? (
              <ThemedView style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={textColor + '40'} />
                <ThemedText style={[styles.emptyText, { color: textColor + '80' }]}>
                  Busque por livros
                </ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: textColor + '60' }]}>
                  Digite o nome do livro para começar
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.resultsList}>
                {searchResults.map((book) => {
                  const isAdding = addingBook === book.id;

                  return (
                    <TouchableOpacity
                      key={book.id}
                      style={[styles.bookCard, { backgroundColor: backgroundColor }]}
                      onPress={() => handleBookPress(book)}
                      disabled={isAdding}
                      activeOpacity={0.7}>
                      {/* Book Cover */}
                      <ThemedView style={[styles.bookCoverContainer, { backgroundColor: tintColor + '20' }]}>
                        {book.coverUrl ? (
                          <Image
                            source={{ uri: book.coverUrl }}
                            style={styles.bookCover}
                            contentFit="cover"
                            transition={200}
                            placeholderContentFit="cover"
                          />
                        ) : (
                          <Ionicons name="book" size={32} color={tintColor} />
                        )}
                      </ThemedView>

                      {/* Book Info */}
                      <ThemedView style={styles.bookInfo}>
                        <ThemedView style={styles.bookTitleRow}>
                          <ThemedText style={styles.bookTitle} numberOfLines={2}>
                            {book.title}
                          </ThemedText>
                          {book.source === 'openlibrary' && (
                            <ThemedView style={[styles.sourceBadge, { backgroundColor: tintColor + '20' }]}>
                              <ThemedText style={[styles.sourceBadgeText, { color: tintColor }]}>
                                OL
                              </ThemedText>
                            </ThemedView>
                          )}
                        </ThemedView>
                        <ThemedText
                          style={[styles.bookAuthor, { color: textColor + '80' }]}
                          numberOfLines={1}>
                          {book.authors && book.authors.length > 0 
                            ? book.authors.join(', ') 
                            : 'Autor desconhecido'}
                        </ThemedText>
                        {(book.publishedDate || book.pageCount) && (
                          <ThemedText
                            style={[styles.bookMeta, { color: textColor + '60' }]}
                            numberOfLines={1}>
                            {book.publishedDate && new Date(book.publishedDate).getFullYear()}
                            {book.publishedDate && book.pageCount && ' • '}
                            {book.pageCount && `${book.pageCount} páginas`}
                          </ThemedText>
                        )}
                      </ThemedView>

                      {/* Add Button */}
                      <ThemedView style={styles.addButtonContainer}>
                        {isAdding ? (
                          <ActivityIndicator size="small" color={tintColor} />
                        ) : (
                          <Ionicons name="add-circle" size={28} color={tintColor} />
                        )}
                      </ThemedView>
                    </TouchableOpacity>
                  );
                })}
              </ThemedView>
            )}
          </ScrollView>

          {/* Status Selection Modal */}
          {selectedBook && (
            <>
              <ThemedView style={styles.statusModalBackdrop} />
              <SafeAreaView edges={['bottom']} style={[styles.statusModal, { backgroundColor: backgroundColor }]}>
                <ThemedView style={styles.statusModalHeader}>
                  <ThemedText style={[styles.statusModalTitle, { color: textColor }]}>
                    Escolha o status
                  </ThemedText>
                  <TouchableOpacity onPress={handleCancelSelection} style={styles.statusModalClose}>
                    <Ionicons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </ThemedView>

              <ThemedView style={styles.statusModalBookInfo}>
                <ThemedText style={[styles.statusModalBookTitle, { color: textColor }]} numberOfLines={2}>
                  {selectedBook.title}
                </ThemedText>
                <ThemedText style={[styles.statusModalBookAuthor, { color: textColor + '80' }]} numberOfLines={1}>
                  {selectedBook.authors && selectedBook.authors.length > 0 
                    ? selectedBook.authors.join(', ') 
                    : 'Autor desconhecido'}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.statusOptionsList}>
                {statusOptions.map((option) => {
                  const isSelected = selectedStatus === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.statusOption,
                        { 
                          backgroundColor: isSelected ? tintColor + '20' : backgroundColor,
                          borderColor: isSelected ? tintColor : textColor + '20',
                        },
                      ]}
                      onPress={() => setSelectedStatus(option.id)}
                      activeOpacity={0.7}>
                      <ThemedView style={[styles.statusOptionIcon, { backgroundColor: tintColor + '15' }]}>
                        <Ionicons 
                          name={option.icon as keyof typeof Ionicons.glyphMap} 
                          size={24} 
                          color={isSelected ? tintColor : textColor + '60'} 
                        />
                      </ThemedView>
                      <ThemedText 
                        style={[
                          styles.statusOptionLabel,
                          { 
                            color: isSelected ? tintColor : textColor,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}>
                        {option.label}
                      </ThemedText>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ThemedView>

              <ThemedView style={styles.statusModalActions}>
                <TouchableOpacity
                  style={[styles.statusModalButton, styles.statusModalButtonCancel]}
                  onPress={handleCancelSelection}>
                  <ThemedText style={[styles.statusModalButtonText, { color: textColor }]}>
                    Cancelar
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusModalButton, styles.statusModalButtonConfirm, { backgroundColor: tintColor }]}
                  onPress={handleConfirmAdd}
                  disabled={addingBook === selectedBook.id}>
                  {addingBook === selectedBook.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={[styles.statusModalButtonText, { color: '#fff' }]}>
                      Adicionar
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </ThemedView>
              </SafeAreaView>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    margin: 0,
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultsList: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bookCoverContainer: {
    width: 60,
    height: 90,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  bookTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bookAuthor: {
    fontSize: 14,
  },
  bookMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  addButtonContainer: {
    padding: 8,
  },
  statusModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
    maxHeight: '80%',
  },
  statusModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusModalClose: {
    padding: 4,
  },
  statusModalBookInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statusModalBookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusModalBookAuthor: {
    fontSize: 14,
  },
  statusOptionsList: {
    gap: 12,
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  statusOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionLabel: {
    flex: 1,
    fontSize: 16,
  },
  statusModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusModalButtonCancel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusModalButtonConfirm: {
    minHeight: 48,
  },
  statusModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

