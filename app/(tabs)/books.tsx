import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookDetailsModal } from '@/components/book-details-modal';
import { BookOptionsSheet } from '@/components/book-options-sheet';
import { BookSearchModal } from '@/components/book-search-modal';
import { EmptyState } from '@/components/empty-state';
import { LoadingScreen } from '@/components/loading-screen';
import { ScreenHeader } from '@/components/screen-header';
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

  const handleAddBook = () => {
    setSearchModalVisible(true);
  };

  const handleBookAdded = () => {
    loadBooks();
  };

  const handleBookPress = (book: Book) => {
    setSelectedBookForDetails(book);
    setDetailsModalVisible(true);
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
  
  useEffect(() => {
    if (params.add === 'true') {
      handleAddBook();
      router.setParams({ add: undefined });
    }
  }, [params.add]);

  const tabs: TabOption<BookStatus | 'all'>[] = [
    { id: 'all', label: 'Todos', icon: 'library-outline' },
    { id: 'want-to-read', label: 'Quero Ler', icon: 'bookmark-outline' },
    { id: 'reading', label: 'Lendo', icon: 'book-outline' },
    { id: 'read', label: 'Já Li', icon: 'checkmark-circle-outline' },
    { id: 'rereading', label: 'Relendo', icon: 'refresh-outline' },
  ];

  const filteredBooks = activeTab === 'all' 
    ? books 
    : books.filter((book) => book.status === activeTab);

  if (loading) {
    return <LoadingScreen message="Carregando livros..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScreenHeader
        title="Meus Livros"
        onAddPress={handleAddBook}
      />

      <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
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
        ) : (
          <ThemedView style={styles.booksList}>
            {filteredBooks.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={[styles.bookCard, { backgroundColor: backgroundColor, borderColor: textColor + '10' }]}
                onPress={() => handleBookPress(book)}
                activeOpacity={0.7}>
                <ThemedView style={[styles.bookCover, { backgroundColor: tintColor + '20' }]}>
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
                </ThemedView>
                <ThemedView style={styles.bookInfo}>
                  <ThemedText style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </ThemedText>
                  <ThemedText style={[styles.bookAuthor, { color: textColor + '80' }]} numberOfLines={1}>
                    {book.author}
                  </ThemedText>
                </ThemedView>
                <TouchableOpacity
                  style={styles.bookMenu}
                  onPress={() => handleBookOptions(book)}
                  onPressIn={(e) => {
                    e.stopPropagation();
                  }}>
                  <Ionicons name="ellipsis-vertical" size={20} color={textColor} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}
      </ScrollView>

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
    paddingBottom: 40,
  },
  booksList: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
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
