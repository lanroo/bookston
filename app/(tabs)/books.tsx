import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookDetailsModal } from '@/components/book-details/book-details-modal';
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
import { useThemeColor } from '@/hooks/use-theme-color';
import { BooksService } from '@/services/books.service';
import type { Book, BookStatus } from '@/types';

export default function BooksScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
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
  const scrollViewRef = useRef<ScrollView>(null);
  const tabBarPadding = useTabBarPadding();

  const filteredBooks = activeTab === 'all' 
    ? books 
    : books.filter((book) => book.status === activeTab);

  const loadBooks = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const booksData = await BooksService.getBooks();
      setBooks(booksData);
    } catch (error: any) {
      console.error('Error loading books:', error);
      Alert.alert('Erro', 'Não foi possível carregar os livros. Tente novamente.');
    } finally {
      setLoading(false);
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
              console.error('Error deleting books:', error);
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
      console.error('Error updating book status:', error);
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
              console.error('Error deleting book:', error);
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

  const rightAction = selectionMode ? (
    <TouchableOpacity
      style={[styles.cancelButtonHeader, { backgroundColor: textColor + '20' }]}
      onPress={() => {
        setSelectionMode(false);
        setSelectedBookIds(new Set());
      }}>
      <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>Cancelar</ThemedText>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={[styles.editButton, { backgroundColor: tintColor + '20' }]}
      onPress={() => setSelectionMode(true)}>
      <Ionicons name="create-outline" size={20} color={tintColor} />
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

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarPadding },
          selectionMode && styles.scrollContentWithSelectionBar
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
          />
        )}
      </ScrollView>

      {selectionMode && (
        <SafeAreaView edges={['bottom']} style={styles.selectionBarContainer}>
          <ThemedView style={[styles.selectionBar, { backgroundColor, borderTopColor: textColor + '20' }]}>
            <View style={styles.selectionBarTop}>
              <ThemedText style={[styles.selectionCount, { color: textColor }]}>
                {selectedBookIds.size} {selectedBookIds.size === 1 ? 'selecionado' : 'selecionados'}
              </ThemedText>
            </View>
            
            <View style={styles.selectionBarActions}>
              <TouchableOpacity
                style={[styles.selectionButton, { backgroundColor: tintColor + '20', borderColor: tintColor + '40' }]}
                onPress={handleSelectAll}>
                <Ionicons 
                  name={selectedBookIds.size === filteredBooks.length ? 'checkbox' : 'square-outline'} 
                  size={18} 
                  color={tintColor} 
                />
                <ThemedText style={[styles.selectionButtonText, { color: tintColor }]} numberOfLines={1}>
                  {selectedBookIds.size === filteredBooks.length ? 'Desmarcar' : 'Selecionar Todos'}
                </ThemedText>
              </TouchableOpacity>
              
              {selectedBookIds.size > 0 && (
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: '#ff3b30' }]}
                  onPress={handleDeleteSelected}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <ThemedText style={styles.deleteButtonText} numberOfLines={1}>Deletar</ThemedText>
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
  scrollContentWithSelectionBar: {
    paddingBottom: 100,
  },
  booksList: {
    gap: 12,
  },
  selectionBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  selectionBar: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  selectionBarTop: {
    marginBottom: 10,
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  selectionBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    flex: 1,
    borderWidth: 1,
    minHeight: 44,
  },
  selectionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    minWidth: 100,
    maxWidth: 120,
    minHeight: 44,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButtonHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
