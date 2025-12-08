import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InteractiveRating } from '@/components/interactive-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BooksService } from '@/services/books.service';
import type { Book } from '@/types';

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

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
    if (diffInSeconds < 2592000) return `há ${Math.floor(diffInSeconds / 604800)} semanas`;
    if (diffInSeconds < 31536000) return `há ${Math.floor(diffInSeconds / 2592000)} meses`;
    return `há ${Math.floor(diffInSeconds / 31536000)} anos`;
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
      console.error('Error fetching book details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!book) return;

    setSavingNotes(true);
    try {
      await BooksService.updateBook(book.id, { notes: notesValue });
      setEditingNotes(false);
    } catch (error: any) {
      console.error('Error saving notes:', error);
      Alert.alert('Erro', 'Não foi possível salvar as notas.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveRating = async (rating: number) => {
    if (!book) return;

    setSavingRating(true);
    try {
      await BooksService.updateBook(book.id, { rating });
      setUserRating(rating);
      // Atualizar o livro localmente sem recarregar tudo
      // Não chamar onBookUpdated aqui para evitar fechar o modal
    } catch (error: any) {
      console.error('Error saving rating:', error);
      Alert.alert('Erro', 'Não foi possível salvar a avaliação.');
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


  const renderStars = (rating: number, interactive: boolean = false, size: number = 20) => {
    return (
      <ThemedView style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={interactive && !savingRating ? () => handleSaveRating(star) : undefined}
            disabled={!interactive || savingRating}
            activeOpacity={interactive ? 0.7 : 1}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? '#FFD700' : textColor + '40'}
            />
          </TouchableOpacity>
        ))}
      </ThemedView>
    );
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
          <ThemedView style={styles.bookHeader}>
            <ThemedView style={[styles.coverContainer, { backgroundColor: tintColor + '20' }]}>
              {coverUrl ? (
                <Image
                  source={{ uri: coverUrl }}
                  style={styles.cover}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Ionicons name="book" size={64} color={tintColor} />
              )}
            </ThemedView>

            <ThemedView style={styles.basicInfo}>
              <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={3}>
                {book.title}
              </ThemedText>
              <ThemedText style={[styles.author, { color: textColor + '80' }]} numberOfLines={2}>
                {book.author}
              </ThemedText>

              <ThemedView style={styles.ratingSection}>
                <ThemedText style={[styles.ratingLabel, { color: textColor + '80' }]}>
                  Sua avaliação:
                </ThemedText>
                <InteractiveRating
                  rating={userRating || 0}
                  onRatingChange={handleSaveRating}
                  saving={savingRating}
                  size={28}
                />
                {savingRating && (
                  <ActivityIndicator size="small" color={tintColor} style={styles.savingIndicator} />
                )}
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {loadingDetails ? (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText style={[styles.loadingText, { color: textColor + '80' }]}>
                Carregando detalhes...
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedView style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  Informações
                </ThemedText>
                <ThemedView style={styles.metadataGrid}>
                  {bookDetails?.volumeInfo.publishedDate && (
                    <ThemedView style={[styles.metadataCard, { borderLeftColor: '#FFB6C1' }]}>
                      <ThemedView style={[styles.metadataIconContainer, { backgroundColor: '#FFB6C1' + '20' }]}>
                        <Ionicons name="calendar" size={18} color="#FFB6C1" />
                      </ThemedView>
                      <View style={styles.metadataTextContainer}>
                        <ThemedText style={[styles.metadataLabel, { color: textColor + '60' }]}>
                          Publicado
                        </ThemedText>
                        <ThemedText style={[styles.metadataValue, { color: textColor }]}>
                          {new Date(bookDetails.volumeInfo.publishedDate).getFullYear()}
                        </ThemedText>
                      </View>
                    </ThemedView>
                  )}

                  {bookDetails?.volumeInfo.pageCount && (
                    <ThemedView style={[styles.metadataCard, { borderLeftColor: '#B19CD9' }]}>
                      <ThemedView style={[styles.metadataIconContainer, { backgroundColor: '#B19CD9' + '20' }]}>
                        <Ionicons name="document-text" size={18} color="#B19CD9" />
                      </ThemedView>
                      <View style={styles.metadataTextContainer}>
                        <ThemedText style={[styles.metadataLabel, { color: textColor + '60' }]}>
                          Páginas
                        </ThemedText>
                        <ThemedText style={[styles.metadataValue, { color: textColor }]}>
                          {bookDetails.volumeInfo.pageCount}
                        </ThemedText>
                      </View>
                    </ThemedView>
                  )}

                  {bookDetails?.volumeInfo.publisher && (
                    <ThemedView style={[styles.metadataCard, { borderLeftColor: '#A8D5E2' }]}>
                      <ThemedView style={[styles.metadataIconContainer, { backgroundColor: '#A8D5E2' + '20' }]}>
                        <Ionicons name="business" size={18} color="#A8D5E2" />
                      </ThemedView>
                      <View style={styles.metadataTextContainer}>
                        <ThemedText style={[styles.metadataLabel, { color: textColor + '60' }]}>
                          Editora
                        </ThemedText>
                        <ThemedText style={[styles.metadataValue, { color: textColor }]} numberOfLines={1}>
                          {bookDetails.volumeInfo.publisher}
                        </ThemedText>
                      </View>
                    </ThemedView>
                  )}

                  {bookDetails?.volumeInfo.language && (
                    <ThemedView style={[styles.metadataCard, { borderLeftColor: '#B5E5CF' }]}>
                      <ThemedView style={[styles.metadataIconContainer, { backgroundColor: '#B5E5CF' + '20' }]}>
                        <Ionicons name="language" size={18} color="#B5E5CF" />
                      </ThemedView>
                      <View style={styles.metadataTextContainer}>
                        <ThemedText style={[styles.metadataLabel, { color: textColor + '60' }]}>
                          Idioma
                        </ThemedText>
                        <ThemedText style={[styles.metadataValue, { color: textColor }]}>
                          {bookDetails.volumeInfo.language.toUpperCase()}
                        </ThemedText>
                      </View>
                    </ThemedView>
                  )}
                </ThemedView>

                {/* Categories */}
                {bookDetails?.volumeInfo.categories && bookDetails.volumeInfo.categories.length > 0 && (
                  <ThemedView style={styles.categoriesSection}>
                    <ThemedText style={[styles.categoriesTitle, { color: textColor }]}>
                      Categorias
                    </ThemedText>
                    <ThemedView style={styles.categoriesContainer}>
                      {bookDetails.volumeInfo.categories.slice(0, 6).map((category, index) => {
                        const colors = [
                          { bg: '#C8A2C8', text: '#fff' },
                          { bg: '#B19CD9', text: '#fff' },
                          { bg: '#B19CD9', text: '#fff' },
                          { bg: '#F38181', text: '#fff' },
                          { bg: '#AA96DA', text: '#fff' },
                          { bg: '#FCBAD3', text: '#2C3E50' },
                        ];
                        const color = colors[index % colors.length];
                        return (
                          <ThemedView
                            key={index}
                            style={[styles.categoryTag, { backgroundColor: color.bg }]}>
                            <ThemedText style={[styles.categoryText, { color: color.text }]}>
                              {category}
                            </ThemedText>
                          </ThemedView>
                        );
                      })}
                    </ThemedView>
                  </ThemedView>
                )}
              </ThemedView>

              {/* Description/Synopsis */}
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

              {/* Personal Notes */}
              <ThemedView style={styles.section}>
                <ThemedView style={styles.sectionHeader}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Suas Notas
                  </ThemedText>
                  {!editingNotes && (
                    <TouchableOpacity
                      onPress={() => setEditingNotes(true)}
                      style={styles.editButtonSmall}>
                      <Ionicons name="create-outline" size={16} color={tintColor} />
                    </TouchableOpacity>
                  )}
                </ThemedView>

                {editingNotes ? (
                  <ThemedView>
                    <TextInput
                      style={[
                        styles.notesInputCompact,
                        {
                          color: textColor,
                          backgroundColor: backgroundColor,
                          borderColor: textColor + '20',
                        },
                      ]}
                      value={notesValue}
                      onChangeText={setNotesValue}
                      placeholder="Adicione suas notas..."
                      placeholderTextColor={textColor + '60'}
                      multiline
                      textAlignVertical="top"
                      autoFocus
                    />
                    <ThemedView style={styles.editActionsCompact}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingNotes(false);
                          setNotesValue(book.notes || '');
                        }}
                        style={styles.cancelButtonCompact}>
                        <ThemedText style={[styles.cancelButtonText, { color: textColor + '80' }]}>
                          Cancelar
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveNotes}
                        disabled={savingNotes}
                        style={[styles.saveButtonCompact, { backgroundColor: tintColor }]}>
                        {savingNotes ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <ThemedText style={[styles.saveButtonText, { color: '#fff' }]}>
                            Salvar
                          </ThemedText>
                        )}
                      </TouchableOpacity>
                    </ThemedView>
                  </ThemedView>
                ) : (
                  <TouchableOpacity
                    onPress={() => setEditingNotes(true)}
                    activeOpacity={0.7}
                    style={[styles.notesContainer, { backgroundColor: isDark ? tintColor + '10' : tintColor + '08' }]}>
                    <ThemedText style={[styles.notesTextCompact, { color: textColor + '90' }]} numberOfLines={3}>
                      {book.notes || 'Toque para adicionar notas sobre este livro...'}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>

              {/* Reviews Section */}
              <ThemedView style={styles.section}>
                <ThemedView style={styles.reviewsHeader}>
                  <ThemedView style={styles.reviewsHeaderTop}>
                    <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                      Avaliações e Resenhas
                    </ThemedText>
                    {appReviews.length > 0 && (
                      <ThemedView style={styles.reviewsStats}>
                        <ThemedView style={styles.reviewsStatsItem}>
                          <Ionicons name="star" size={18} color="#FFD700" />
                          <ThemedText style={[styles.reviewsStatsText, { color: textColor }]}>
                            {(
                              appReviews.reduce((sum, r) => sum + r.rating, 0) / appReviews.length
                            ).toFixed(1)}
                          </ThemedText>
                        </ThemedView>
                        <ThemedText style={[styles.reviewsStatsText, { color: textColor + '70' }]}>
                          • {appReviews.length} {appReviews.length === 1 ? 'avaliação' : 'avaliações'}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                </ThemedView>

                {appReviews.length === 0 ? (
                  <ThemedView style={styles.emptyReviewsContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color={textColor + '40'} />
                    <ThemedText style={[styles.emptyReviewsText, { color: textColor + '80' }]}>
                      Ainda não há avaliações
                    </ThemedText>
                    <ThemedText style={[styles.emptyReviewsSubtext, { color: textColor + '60' }]}>
                      Seja o primeiro a avaliar este livro!
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.reviewsContainer}>
                    {appReviews.map((review) => (
                      <ThemedView key={review.id} style={styles.reviewCard}>
                        <ThemedView style={styles.reviewHeader}>
                          <ThemedView style={styles.reviewAuthorInfo}>
                            <ThemedView
                              style={[
                                styles.reviewAvatar,
                                { backgroundColor: review.avatarColor + '30' },
                              ]}>
                              <ThemedText
                                style={[styles.reviewAvatarText, { color: review.avatarColor }]}>
                                {review.userInitials}
                              </ThemedText>
                            </ThemedView>
                            <ThemedView style={styles.reviewAuthorDetails}>
                              <ThemedText style={[styles.reviewAuthorName, { color: textColor }]}>
                                {review.userName}
                              </ThemedText>
                              <ThemedView style={styles.reviewMeta}>
                                {renderStars(review.rating, false, 14)}
                                <ThemedText style={[styles.reviewDate, { color: textColor + '60' }]}>
                                  • {formatTimeAgo(review.createdAt)}
                                </ThemedText>
                              </ThemedView>
                            </ThemedView>
                          </ThemedView>
                          <ThemedView style={styles.reviewActions}>
                            <TouchableOpacity
                              style={styles.reviewActionButton}
                              onPress={() => handleToggleLike(review.id)}>
                              <Ionicons
                                name={review.liked ? 'heart' : 'heart-outline'}
                                size={18}
                                color={review.liked ? '#FF6B6B' : textColor + '60'}
                              />
                              <ThemedText
                                style={[
                                  styles.reviewActionText,
                                  { color: review.liked ? '#FF6B6B' : textColor + '60' },
                                ]}>
                                {review.likes}
                              </ThemedText>
                            </TouchableOpacity>
                          </ThemedView>
                        </ThemedView>
                        <ThemedText style={[styles.reviewText, { color: textColor + '90' }]}>
                          {review.review}
                        </ThemedText>
                        {review.tags.length > 0 && (
                          <ThemedView style={styles.reviewTags}>
                            {review.tags.map((tag, index) => (
                              <ThemedView
                                key={index}
                                style={[styles.reviewTag, { backgroundColor: tintColor + '20' }]}>
                                <ThemedText style={[styles.reviewTagText, { color: tintColor }]}>
                                  {tag}
                                </ThemedText>
                              </ThemedView>
                            ))}
                          </ThemedView>
                        )}
                      </ThemedView>
                    ))}

                    <TouchableOpacity style={styles.viewMoreButton}>
                      <ThemedText style={[styles.viewMoreText, { color: tintColor }]}>
                        Ver mais avaliações
                      </ThemedText>
                      <Ionicons name="chevron-down" size={18} color={tintColor} />
                    </TouchableOpacity>
                  </ThemedView>
                )}
              </ThemedView>
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

