import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookDetailsModal } from '@/components/book-details/book-details-modal';
import { BookGridCard } from '@/components/book-grid-card';
import { BookOptionsSheet } from '@/components/book-options-sheet';
import { BookSearchModal } from '@/components/book-search-modal';
import { EmptyState } from '@/components/empty-state';
import { LoadingScreen } from '@/components/loading-screen';
import { ReorderableBookList } from '@/components/reorder';
import { ScreenHeader } from '@/components/screen-header';
import { SwipeableBookCard } from '@/components/swipeable-book-card';
import { useTabBarPadding } from '@/components/tab-bar';
import { TabSelector, type TabOption } from '@/components/tab-selector';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BooksService } from '@/services/books.service';
import type { Book, BookStatus } from '@/types';
import { logger } from '@/utils/logger';

export default function BooksScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<BookStatus | 'all'>('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [optionsSheetVisible, setOptionsSheetVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const scrollViewRef = useRef<ScrollView>(null);
  const tabBarPadding = useTabBarPadding();
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 64;
  const indicatorAnim = useRef(new Animated.Value(viewMode === 'grid' ? 0 : 1)).current;

  const filteredBooks = activeTab === 'all' 
    ? books 
    : books.filter((book) => book.status === activeTab);

  const loadBooks = useCallback(async (showLoading = true) => {
    if (!user) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      const booksData = await BooksService.getBooks();
      setBooks(booksData);
    } catch (error: any) {
      logger.error('Error loading books', error);
      if (showLoading) {
        Alert.alert('Erro', 'Não foi possível carregar os livros. Tente novamente.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [loadBooks])
  );

  const handleAddBook = useCallback(() => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedBookIds(new Set());
    }
    setSearchModalVisible(true);
  }, [selectionMode]);

  const handleBookAdded = () => {
    loadBooks();
  };

  const handleBookPress = (book: Book) => {
    if (selectionMode) {
      toggleBookSelection(book.id);
    } else {
      setSelectedBookForDetails(book);
      setDetailsModalVisible(true);
    }
  };

  const handleBookLongPress = (book: Book) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedBookIds(new Set([book.id]));
    }
  };

  const toggleBookSelection = (bookId: string) => {
    const newSelection = new Set(selectedBookIds);
    if (newSelection.has(bookId)) {
      newSelection.delete(bookId);
    } else {
      newSelection.add(bookId);
    }
    setSelectedBookIds(newSelection);
    
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedBookIds.size === filteredBooks.length) {
      setSelectedBookIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedBookIds(new Set(filteredBooks.map((b) => b.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedBookIds.size === 0) return;

    const count = selectedBookIds.size;
    Alert.alert(
      'Deletar Livros',
      `Tem certeza que deseja deletar ${count} ${count === 1 ? 'livro' : 'livros'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await BooksService.deleteBooks(Array.from(selectedBookIds));
              Alert.alert('Sucesso', `${count} ${count === 1 ? 'livro deletado' : 'livros deletados'} com sucesso!`);
              setSelectedBookIds(new Set());
              setSelectionMode(false);
              loadBooks();
            } catch (error: any) {
              logger.error('Error deleting books', error, { count: selectedBookIds.size });
              Alert.alert('Erro', 'Não foi possível deletar os livros.');
            }
          },
        },
      ]
    );
  };

  const handleBookOptions = (book: Book) => {
    setSelectedBook(book);
    setOptionsSheetVisible(true);
  };

  const handleUpdateStatus = async (book: Book, status: BookStatus) => {
    try {
      await BooksService.updateBook(book.id, { status });
      Alert.alert('Sucesso', 'Status do livro atualizado!');
      loadBooks();
    } catch (error: any) {
      logger.error('Error updating book status', error, { bookId: book.id, status });
      Alert.alert('Erro', 'Não foi possível atualizar o status do livro.');
    }
  };

  const handleDeleteBook = async (book: Book) => {
    Alert.alert(
      'Deletar Livro',
      `Tem certeza que deseja deletar "${book.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await BooksService.deleteBook(book.id);
              Alert.alert('Sucesso', 'Livro deletado com sucesso!');
              loadBooks();
            } catch (error: any) {
              logger.error('Error deleting book', error, { bookId: book.id });
              Alert.alert('Erro', 'Não foi possível deletar o livro.');
            }
          },
        },
      ]
    );
  };


  const tabs: TabOption<BookStatus | 'all'>[] = [
    { id: 'all', label: 'Todos', icon: 'library-outline' },
    { id: 'want-to-read', label: 'Quero Ler', icon: 'bookmark-outline' },
    { id: 'reading', label: 'Lendo', icon: 'book-outline' },
    { id: 'read', label: 'Já Li', icon: 'checkmark-circle-outline' },
    { id: 'rereading', label: 'Relendo', icon: 'refresh-outline' },
  ];

  
  useEffect(() => {
    if (params.add === 'true') {
      handleAddBook();
      router.setParams({ add: undefined });
    }
  }, [params.add]);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: viewMode === 'grid' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [viewMode, indicatorAnim]);

  const rightAction = selectionMode ? (
    <TouchableOpacity
      style={[styles.cancelButtonHeader, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
      onPress={() => {
        setSelectionMode(false);
        setSelectedBookIds(new Set());
      }}
      activeOpacity={0.7}>
      <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>Cancelar</ThemedText>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={[styles.editButton, { backgroundColor: tintColor + '15' }]}
      onPress={() => setSelectionMode(true)}
      activeOpacity={0.7}>
      <Ionicons name="checkmark-circle-outline" size={22} color={tintColor} />
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen message="Carregando livros..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScreenHeader
        title="Meus Livros"
        onAddPress={!selectionMode ? handleAddBook : undefined}
        rightAction={rightAction}
      />

      <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {filteredBooks.length > 0 && !selectionMode && (
        <ThemedView style={[styles.toolbar, { backgroundColor, borderBottomColor: textColor + '10' }]}>
          <ThemedView style={styles.toolbarContent}>
            <ThemedView style={styles.toolbarLeft}>
              <ThemedText style={[styles.toolbarTitle, { color: textColor }]}>
                {filteredBooks.length} {filteredBooks.length === 1 ? 'livro' : 'livros'}
              </ThemedText>
            </ThemedView>
            <ThemedView style={[styles.segmentedControl, { 
              backgroundColor: colorScheme === 'dark' ? textColor + '08' : textColor + '05',
              borderColor: textColor + '15',
              shadowColor: colorScheme === 'dark' ? '#000' : '#000',
            }]}>
              <Animated.View
                style={[
                  styles.segmentedIndicator,
                  {
                    backgroundColor: tintColor,
                    shadowColor: tintColor,
                    transform: [
                      {
                        translateX: indicatorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [2, 50],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.segmentedButton}
                onPress={() => setViewMode('grid')}
                activeOpacity={0.7}>
                <Ionicons
                  name="grid"
                  size={19}
                  color={viewMode === 'grid' ? (colorScheme === 'dark' ? '#000' : '#fff') : textColor + '60'}
                />
              </TouchableOpacity>
              <ThemedView style={[styles.segmentedDivider, { backgroundColor: textColor + '15' }]} />
              <TouchableOpacity
                style={styles.segmentedButton}
                onPress={() => setViewMode('list')}
                activeOpacity={0.7}>
                <Ionicons
                  name="list"
                  size={19}
                  color={viewMode === 'list' ? (colorScheme === 'dark' ? '#000' : '#fff') : textColor + '60'}
                />
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: selectionMode ? tabBarPadding + 100 : tabBarPadding },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}>
        {filteredBooks.length === 0 ? (
          <EmptyState
            icon="library-outline"
            title="Nenhum livro aqui ainda"
            description={
              activeTab === 'all'
                ? 'Adicione livros à sua biblioteca'
                : activeTab === 'want-to-read'
                ? 'Adicione livros que você quer ler'
                : activeTab === 'reading'
                  ? 'Adicione livros que você está lendo'
                    : activeTab === 'read'
                      ? 'Adicione livros que você já leu'
                      : 'Adicione livros que você está relendo'
            }
            primaryAction={{
              icon: 'add',
              label: 'Adicionar Livro',
              onPress: handleAddBook,
            }}
          />
        ) : viewMode === 'grid' ? (
          <ThemedView style={styles.booksGrid}>
            {filteredBooks.map((book) => {
              const isSelected = selectedBookIds.has(book.id);
              return (
                <BookGridCard
                  key={book.id}
                  book={book}
                  isSelected={isSelected}
                  selectionMode={selectionMode}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  tintColor={tintColor}
                  onPress={() => {
                    handleBookPress(book);
                  }}
                  onLongPress={() => handleBookLongPress(book)}
                  onOptionsPress={() => handleBookOptions(book)}
                />
              );
            })}
          </ThemedView>
        ) : selectionMode ? (
          <ThemedView style={styles.booksList}>
            {filteredBooks.map((book) => {
              const isSelected = selectedBookIds.has(book.id);
              return (
                <SwipeableBookCard
                  key={book.id}
                  book={book}
                  isSelected={isSelected}
                  isDragging={false}
                  isHoverTarget={false}
                  selectionMode={selectionMode}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  tintColor={tintColor}
                  onPress={() => {
                    handleBookPress(book);
                  }}
                  onLongPress={() => handleBookLongPress(book)}
                  onOptionsPress={() => handleBookOptions(book)}
                  onReorderPress={() => {}}
                  dragHandleProps={undefined}
                />
              );
            })}
          </ThemedView>
        ) : (
          <ReorderableBookList
            books={filteredBooks}
            scrollViewRef={scrollViewRef}
            selectedBookIds={selectedBookIds}
            selectionMode={selectionMode}
            backgroundColor={backgroundColor}
            textColor={textColor}
            tintColor={tintColor}
            onBookPress={handleBookPress}
            onBookLongPress={handleBookLongPress}
            onBookOptions={handleBookOptions}
            style={styles.booksList}
            enabled={!selectionMode}
            onDraggingChange={setIsDragging}
            onOrderSaved={() => loadBooks(false)}
          />
        )}
      </ScrollView>

      {selectionMode && (
        <SafeAreaView edges={[]} style={[styles.selectionBarContainer, { bottom: tabBarHeight }]}>
          <ThemedView style={[styles.selectionBar, { backgroundColor, borderTopColor: textColor + '15' }]}>
            <View style={styles.selectionBarHeader}>
              <View style={[styles.selectionBadge, { backgroundColor: tintColor + '15' }]}>
                <ThemedText style={[styles.selectionCount, { color: tintColor }]}>
                  {selectedBookIds.size}
                </ThemedText>
              </View>
              <ThemedText style={[styles.selectionLabel, { color: textColor }]}>
                {selectedBookIds.size === 1 ? 'selecionado' : 'selecionados'}
              </ThemedText>
            </View>
            
            <View style={styles.selectionBarActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { 
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: textColor + '15',
                  }
                ]}
                onPress={handleSelectAll}
                activeOpacity={0.7}>
                <Ionicons 
                  name={selectedBookIds.size === filteredBooks.length ? 'checkbox' : 'square-outline'} 
                  size={20} 
                  color={tintColor} 
                />
                <ThemedText style={[styles.actionButtonText, { color: textColor }]} numberOfLines={1}>
                  {selectedBookIds.size === filteredBooks.length ? 'Desmarcar' : 'Todos'}
                </ThemedText>
              </TouchableOpacity>
              
              {selectedBookIds.size > 0 && (
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: '#ff3b30' }]}
                  onPress={handleDeleteSelected}
                  activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <ThemedText style={styles.deleteButtonText} numberOfLines={1}>
                    Deletar
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </ThemedView>
        </SafeAreaView>
      )}

      <BookSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onBookAdded={handleBookAdded}
        defaultStatus={activeTab === 'all' ? 'want-to-read' : activeTab}
      />

      <BookOptionsSheet
        visible={optionsSheetVisible}
        book={selectedBook}
        onClose={() => {
          setOptionsSheetVisible(false);
          setSelectedBook(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteBook}
      />

      <BookDetailsModal
        visible={detailsModalVisible}
        book={selectedBookForDetails}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedBookForDetails(null);
        }}
        onBookUpdated={loadBooks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarLeft: {
    flex: 1,
  },
  toolbarTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  segmentedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    width: 104,
    height: 40,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedIndicator: {
    position: 'absolute',
    left: 2,
    top: 2,
    width: 48,
    height: 34,
    borderRadius: 8,
    zIndex: 0,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentedButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderRadius: 8,
  },
  segmentedDivider: {
    width: 1,
    height: 20,
    zIndex: 1,
    marginVertical: 6,
  },
  booksList: {
    gap: 12,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  selectionBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  selectionBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  selectionBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  selectionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectionLabel: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
  },
  selectionBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: 110,
    minHeight: 48,
    shadowColor: '#ff3b30',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cancelButtonHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
