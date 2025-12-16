import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookDetailsModal } from '@/components/book-details/book-details-modal';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BooksService } from '@/services/books.service';
import type { Book } from '@/types';
import { logger } from '@/utils/logger';

export default function BookDetailsScreen() {
  const { bookId, bookTitle, bookAuthor, bookCoverUrl } = useLocalSearchParams<{
    bookId: string;
    bookTitle: string;
    bookAuthor: string;
    bookCoverUrl: string;
  }>();

  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadBook = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Try to find the book in user's library by bookId or title/author
      if (bookId) {
        const allBooks = await BooksService.getBooks();
        const foundBook = allBooks.find((b) => b.id === bookId);
        
        if (foundBook) {
          setBook(foundBook);
          setModalVisible(true);
          return;
        }
      }

      // If not found in library, create a temporary book object for viewing
      if (bookTitle) {
        const tempBook: Book = {
          id: bookId || `temp-${bookTitle}-${bookAuthor}`,
          title: bookTitle,
          author: bookAuthor || 'Autor desconhecido',
          status: 'read',
          userId: user.id,
          coverUrl: bookCoverUrl || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setBook(tempBook);
        setModalVisible(true);
      } else {
        router.back();
      }
    } catch (error) {
      logger.error('Error loading book', error, { bookId, bookTitle });
      router.back();
    } finally {
      setLoading(false);
    }
  }, [bookId, bookTitle, bookAuthor, bookCoverUrl, user]);

  useFocusEffect(
    useCallback(() => {
      loadBook();
    }, [loadBook])
  );

  const handleClose = () => {
    setModalVisible(false);
    router.back();
  };

  const handleBookUpdated = () => {
    // Reload if needed
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        {book && (
          <BookDetailsModal
            visible={modalVisible}
            book={book}
            onClose={handleClose}
            onBookUpdated={handleBookUpdated}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

