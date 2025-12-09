import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookDetailsHeader } from '@/components/book-details/book-details-header';
import { BookMetadataSection } from '@/components/book-details/book-metadata-section';
import { BookNotesSection } from '@/components/book-details/book-notes-section';
import { BookReviewsSection } from '@/components/book-details/book-reviews-section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BooksService } from '@/services/books.service';
import type { Book } from '@/types';
import { logger } from '@/utils/logger';
import { retry } from '@/utils/retry';

interface BookDetailsModalProps {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onBookUpdated: () => void;
}

interface GoogleBookDetails {
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    averageRating?: number;
    ratingsCount?: number;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    language?: string;
    publisher?: string;
    imageLinks?: {
      large?: string;
      medium?: string;
      thumbnail?: string;
    };
  };
}

interface AppReview {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  avatarColor: string;
  rating: number;
  review: string;
  tags: string[];
  likes: number;
  liked: boolean;
  createdAt: string;
}

export function BookDetailsModal({ visible, book, onClose, onBookUpdated }: BookDetailsModalProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  const [bookDetails, setBookDetails] = useState<GoogleBookDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [savingRating, setSavingRating] = useState(false);
  const [appReviews, setAppReviews] = useState<AppReview[]>([]);

  useEffect(() => {
    if (visible && book) {
      setNotesValue(book.notes || '');
      setUserRating(book.rating);
      fetchBookDetails();
      loadAppReviews();
    } else {
      setBookDetails(null);
      setEditingNotes(false);
      setAppReviews([]);
    }
  }, [visible, book]);

  const loadAppReviews = () => {
    const mockReviews: AppReview[] = [
      {
        id: '1',
        userId: 'user1',
        userName: 'Maria Silva',
        userInitials: 'MS',
        avatarColor: '#FF6B6B',
        rating: 5,
        review: 'Um livro incrível! A narrativa é envolvente desde as primeiras páginas. Os personagens são muito bem desenvolvidos e a trama mantém você preso até o final. A autora conseguiu criar um equilíbrio perfeito entre ação e desenvolvimento emocional. Recomendo muito para quem gosta de histórias bem construídas!',
        tags: ['#Recomendo', '#Emocionante'],
        likes: 12,
        liked: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'João Santos',
        userInitials: 'JS',
        avatarColor: '#4ECDC4',
        rating: 4,
        review: 'Boa leitura! O livro tem momentos muito interessantes e a escrita é fluida. Gostei especialmente da construção dos personagens secundários. No entanto, esperava um pouco mais do final - achei que poderia ter sido mais impactante. Mesmo assim, vale a pena ler!',
        tags: ['#BoaLeitura'],
        likes: 8,
        liked: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Ana Costa',
        userInitials: 'AC',
        avatarColor: '#95E1D3',
        rating: 5,
        review: 'Simplesmente perfeito! Uma das melhores leituras do ano. A autora conseguiu criar um mundo único e cativante. Não consegui parar de ler até terminar. Já recomendei para várias amigas!',
        tags: ['#Favorito', '#Recomendo'],
        likes: 24,
        liked: true,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        userId: 'user4',
        userName: 'Pedro Oliveira',
        userInitials: 'PO',
        avatarColor: '#AA96DA',
        rating: 4,
        review: 'Gostei bastante! A história é envolvente e os personagens são cativantes. A única coisa que me incomodou um pouco foi o ritmo em algumas partes, mas no geral é uma excelente leitura.',
        tags: ['#BoaLeitura', '#Envolvente'],
        likes: 5,
        liked: false,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    setAppReviews(mockReviews);
  };

  const handleToggleLike = (reviewId: string) => {
    setAppReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? { ...review, liked: !review.liked, likes: review.liked ? review.likes - 1 : review.likes + 1 }
          : review
      )
    );
  };

  const fetchBookDetails = async () => {
    if (!book) return;

    setLoadingDetails(true);
    try {
      const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=1&langRestrict=pt`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          setBookDetails(data.items[0]);
        }
      }
    } catch (error) {
      logger.error('Error fetching book details', error, { bookId: book.id });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!book) return;

    setSavingNotes(true);
    try {
      await retry(
        () => BooksService.updateBook(book.id, { notes: notesValue }),
        {
          maxAttempts: 3,
          delay: 1000,
          onRetry: (attempt) => {
            logger.warn('Retrying save notes', { attempt, bookId: book.id });
          },
        }
      );
      setEditingNotes(false);
    } catch (error) {
      logger.error('Error saving notes', error, { bookId: book.id });
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível salvar as notas: ${errorMessage}`);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveRating = async (rating: number) => {
    if (!book) return;

    setSavingRating(true);
    try {
      await retry(
        () => BooksService.updateBook(book.id, { rating }),
        {
          maxAttempts: 3,
          delay: 1000,
          onRetry: (attempt) => {
            logger.warn('Retrying save rating', { attempt, bookId: book.id, rating });
          },
        }
      );
      setUserRating(rating);
    } catch (error) {
      logger.error('Error saving rating', error, { bookId: book.id, rating });
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível salvar a avaliação: ${errorMessage}`);
    } finally {
      setSavingRating(false);
    }
  };

  const getCoverUrl = (): string | undefined => {
    if (book?.coverUrl) return book.coverUrl;
    if (bookDetails?.volumeInfo.imageLinks?.large) {
      return bookDetails.volumeInfo.imageLinks.large.replace('http://', 'https://');
    }
    if (bookDetails?.volumeInfo.imageLinks?.medium) {
      return bookDetails.volumeInfo.imageLinks.medium.replace('http://', 'https://');
    }
    return bookDetails?.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://');
  };


  if (!book) return null;

  const coverUrl = getCoverUrl();
  const description = bookDetails?.volumeInfo.description || book.notes;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Detalhes do Livro
          </ThemedText>
          <ThemedView style={styles.closeButton} />
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <BookDetailsHeader
            book={book}
            coverUrl={getCoverUrl()}
            userRating={userRating}
            savingRating={savingRating}
            onRatingChange={handleSaveRating}
            backgroundColor={backgroundColor}
            textColor={textColor}
            tintColor={tintColor}
          />

          {loadingDetails ? (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText style={[styles.loadingText, { color: textColor + '80' }]}>
                Carregando detalhes...
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <BookMetadataSection bookDetails={bookDetails} textColor={textColor} />

              {description && (
                <ThemedView style={styles.section}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Sinopse
                  </ThemedText>
                  <ThemedText style={[styles.description, { color: textColor + '90' }]}>
                    {description}
                  </ThemedText>
                </ThemedView>
              )}

              <BookNotesSection
                notes={book.notes || ''}
                editingNotes={editingNotes}
                savingNotes={savingNotes}
                notesValue={notesValue}
                onNotesValueChange={setNotesValue}
                onStartEdit={() => setEditingNotes(true)}
                onCancelEdit={() => {
                  setEditingNotes(false);
                  setNotesValue(book.notes || '');
                }}
                onSave={handleSaveNotes}
                backgroundColor={backgroundColor}
                textColor={textColor}
                tintColor={tintColor}
                isDark={isDark}
              />

              <BookReviewsSection
                reviews={appReviews}
                onToggleLike={handleToggleLike}
                textColor={textColor}
                tintColor={tintColor}
              />
            </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  coverContainer: {
    width: 120,
    height: 180,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  basicInfo: {
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  author: {
    fontSize: 16,
    fontWeight: '500',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  savingIndicator: {
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metadataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderLeftWidth: 4,
    width: '48%',
    minHeight: 64,
  },
  metadataIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  metadataTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  metadataLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  categoriesSection: {
    marginTop: 4,
  },
  categoriesTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  notesInput: {
    minHeight: 120,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 15,
    lineHeight: 22,
  },
  notesInputCompact: {
    minHeight: 80,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 14,
    lineHeight: 20,
  },
  notesContainer: {
    padding: 12,
    borderRadius: 10,
    minHeight: 60,
    justifyContent: 'center',
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  notesTextCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  editButtonSmall: {
    padding: 6,
  },
  editActionsCompact: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  cancelButtonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  saveButtonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  reviewsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  reviewsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewsStatsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsStatsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewsContainer: {
    gap: 12,
  },
  reviewCard: {
    padding: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewAuthorDetails: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  reviewDate: {
    fontSize: 11,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  reviewActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyReviewsSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});

