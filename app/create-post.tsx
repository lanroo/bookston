import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookSelector } from '@/components/create-post/book-selector';
import { BookStatusButtons } from '@/components/book-status-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BookSearchService } from '@/services/book-search.service';
import { PointsService } from '@/services/points.service';
import { PostsService } from '@/services/posts.service';
import type { BookSearchResult, BookRecommendation } from '@/types';
import type { Book, BookStatus } from '@/types';
import { logger } from '@/utils/logger';

export default function CreatePostScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const { user } = useAuth();
  const params = useLocalSearchParams<{ postId?: string }>();

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookStatus, setBookStatus] = useState<BookStatus>('read');
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showWritingTips, setShowWritingTips] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);

  const handleBookSelect = (book: BookSearchResult | BookRecommendation) => {
    const newBook: Book = {
      id: book.id,
      title: book.title,
      author: book.authors[0] || 'Autor desconhecido',
      status: 'want-to-read',
      userId: '',
      coverUrl: book.coverUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedBook(newBook);
  };

  // Load post for editing
  const loadPostForEditing = useCallback(async (postId: string) => {
    if (!user) return;
    
    setLoadingPost(true);
    try {
      const posts = await PostsService.getPostsByUserId(user.id, 100, 0);
      const post = posts.find(p => p.id === postId);
      
      if (post) {
        setIsEditing(true);
        setSelectedBook({
          id: post.bookId,
          title: post.bookTitle,
          author: post.bookAuthor,
          status: post.bookStatus as BookStatus,
          userId: user.id,
          coverUrl: post.bookCoverUrl,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        });
        setBookStatus(post.bookStatus as BookStatus);
        setRating(post.rating || 0);
        setReviewText(post.content);
        setHasSpoiler(post.hasSpoiler);
        setReadingProgress(post.readingProgress || 0);
      }
    } catch (error) {
      logger.error('Error loading post for editing', error);
      Alert.alert('Erro', 'Não foi possível carregar o post para edição.');
    } finally {
      setLoadingPost(false);
    }
  }, [user]);

  useEffect(() => {
    if (params.postId) {
      loadPostForEditing(params.postId);
    }
  }, [params.postId, loadPostForEditing]);

  const handlePublish = async () => {
    if (!selectedBook) {
      Alert.alert('Atenção', 'Por favor, selecione um livro primeiro.');
      return;
    }

    if (reviewText.trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, escreva sua resenha.');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para publicar.');
      return;
    }

    try {
      if (isEditing && params.postId) {
        // Update existing post
        await PostsService.updatePost(params.postId, {
          content: reviewText.trim(),
          rating: rating > 0 ? rating : undefined,
          bookStatus: bookStatus,
          hasSpoiler,
          readingProgress: bookStatus === 'reading' ? readingProgress : undefined,
        });

        Alert.alert('Sucesso', 'Sua resenha foi atualizada!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        // Create new post
        const post = await PostsService.createPost({
          bookId: selectedBook.id,
          bookTitle: selectedBook.title,
          bookAuthor: selectedBook.author,
          bookCoverUrl: selectedBook.coverUrl,
          bookStatus: bookStatus,
          content: reviewText.trim(),
          rating: rating > 0 ? rating : undefined,
          hasSpoiler,
          readingProgress: bookStatus === 'reading' ? readingProgress : undefined,
        });

        // Award points for creating post
        try {
          await PointsService.awardPoints(user.id, 'post_created', post.id);
        } catch (pointsError) {
          // Points service might fail if tables don't exist, but post was created
          logger.warn('Error awarding points', { error: pointsError, userId: user.id, postId: post.id });
        }

        Alert.alert('Sucesso', 'Sua resenha foi publicada! Você ganhou 10 pontos! 🎉', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      logger.error('Error publishing post', error);
      
      // Check if it's a migration error
      if (error?.message?.includes('Tabela') || error?.message?.includes('migração')) {
        Alert.alert(
          'Migração Necessária',
          'As tabelas do banco de dados ainda não foram criadas. Por favor, execute a migração SQL no Supabase:\n\n' +
          '1. Acesse o Supabase Dashboard\n' +
          '2. Vá em SQL Editor\n' +
          '3. Execute o arquivo: database/migration_social_features.sql\n\n' +
          'Veja o arquivo README_MIGRATION.md para mais detalhes.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível publicar sua resenha. Tente novamente.');
      }
    }
  };

  const writingTips = [
    'O que mais te chamou atenção neste livro?',
    'Como você descreveria os personagens principais?',
    'Qual foi o momento mais marcante para você?',
    'Recomendaria este livro? Por quê?',
    'O que você aprendeu ou sentiu ao ler?',
  ];

  const insertTip = (tip: string) => {
    const currentText = reviewText.trim();
    const newText = currentText ? `${currentText}\n\n${tip}` : tip;
    setReviewText(newText);
    setShowWritingTips(false);
  };

  const StarRating = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
            style={styles.starButton}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? tintColor : (isDark ? textColor + '40' : textColor + '30')}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            {isEditing ? 'Editar Resenha' : 'Nova Resenha'}
          </ThemedText>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowPreview(!showPreview)}
              style={styles.previewButton}
              disabled={!selectedBook || reviewText.trim().length === 0}>
              <Ionicons
                name={showPreview ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={selectedBook && reviewText.trim().length > 0 ? tintColor : textColor + '40'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePublish}
              style={[
                styles.publishButton,
                {
                  backgroundColor: tintColor,
                  opacity: selectedBook && reviewText.trim().length > 0 ? 1 : 0.5,
                },
              ]}
              disabled={!selectedBook || reviewText.trim().length === 0}>
              <ThemedText style={styles.publishButtonText}>Publicar</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedView style={[styles.section, { borderColor }]}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Selecionar Livro
            </ThemedText>
            {selectedBook ? (
              <TouchableOpacity
                style={[styles.bookCard, { backgroundColor: backgroundColor, borderColor }]}
                onPress={() => setShowBookSearch(true)}
                activeOpacity={0.7}>
                {selectedBook.coverUrl ? (
                  <Image source={{ uri: selectedBook.coverUrl }} style={styles.bookCover} />
                ) : (
                  <View style={[styles.bookCoverPlaceholder, { backgroundColor: borderColor }]}>
                    <Ionicons name="book" size={32} color={textColor} style={{ opacity: 0.3 }} />
                  </View>
                )}
                <View style={styles.bookInfo}>
                  <ThemedText style={[styles.bookTitle, { color: textColor }]} numberOfLines={2}>
                    {selectedBook.title}
                  </ThemedText>
                  <ThemedText style={[styles.bookAuthor, { color: textColor, opacity: 0.6 }]}>
                    {selectedBook.author}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={textColor} style={{ opacity: 0.3 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.selectBookButton, { borderColor: tintColor }]}
                onPress={() => setShowBookSearch(true)}
                activeOpacity={0.7}>
                <Ionicons name="add-circle-outline" size={32} color={tintColor} />
                <ThemedText style={[styles.selectBookText, { color: tintColor }]}>
                  Selecionar Livro
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>

          {selectedBook && (
            <>
              <ThemedView style={[styles.section, { borderColor }]}>
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  Status do Livro
                </ThemedText>
                <BookStatusButtons
                  currentStatus={bookStatus}
                  onStatusChange={(status) => {
                    setBookStatus(status);
                    if (status !== 'reading') {
                      setReadingProgress(0);
                    }
                  }}
                />
                {bookStatus === 'reading' && (
                  <View style={styles.progressContainer}>
                    <ThemedText style={[styles.progressLabel, { color: textColor, opacity: 0.7 }]}>
                      Progresso de Leitura
                    </ThemedText>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${readingProgress}%`,
                              backgroundColor: tintColor,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText style={[styles.progressText, { color: textColor }]}>
                        {readingProgress}%
                      </ThemedText>
                    </View>
                    <View style={styles.progressButtons}>
                      {[0, 25, 50, 75, 100].map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={[
                            styles.progressButton,
                            {
                              backgroundColor: readingProgress === value ? tintColor + '20' : 'transparent',
                              borderColor: readingProgress === value ? tintColor : borderColor,
                            },
                          ]}
                          onPress={() => setReadingProgress(value)}>
                          <ThemedText
                            style={[
                              styles.progressButtonText,
                              {
                                color: readingProgress === value ? tintColor : textColor,
                                fontWeight: readingProgress === value ? '600' : '400',
                              },
                            ]}>
                            {value}%
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </ThemedView>

              <ThemedView style={[styles.section, { borderColor }]}>
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  Avaliação
                </ThemedText>
                <StarRating />
                {rating > 0 && (
                  <ThemedText style={[styles.ratingText, { color: textColor, opacity: 0.6 }]}>
                    {rating} de 5 estrelas
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={[styles.section, { borderColor }]}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Sua Resenha
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowWritingTips(!showWritingTips)}
                    style={styles.tipsButton}>
                    <Ionicons name="bulb-outline" size={18} color={tintColor} />
                    <ThemedText style={[styles.tipsButtonText, { color: tintColor }]}>
                      Dicas
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                {showWritingTips && (
                  <View style={[styles.tipsContainer, { backgroundColor: tintColor + '10', borderColor: tintColor + '30' }]}>
                    <ThemedText style={[styles.tipsTitle, { color: textColor }]}>
                      Precisa de inspiração? Tente responder:
                    </ThemedText>
                    {writingTips.map((tip, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.tipItem}
                        onPress={() => insertTip(tip)}
                        activeOpacity={0.7}>
                        <Ionicons name="add-circle-outline" size={16} color={tintColor} />
                        <ThemedText style={[styles.tipText, { color: textColor }]}>
                          {tip}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={[styles.textInputContainer, { borderColor, backgroundColor }]}>
                  <TextInput
                    style={[styles.textInput, { color: textColor }]}
                    placeholder="Compartilhe seus pensamentos sobre este livro..."
                    placeholderTextColor={isDark ? textColor + '40' : textColor + '50'}
                    multiline
                    numberOfLines={8}
                    value={reviewText}
                    onChangeText={setReviewText}
                    textAlignVertical="top"
                  />
                  <View style={styles.charCount}>
                    <ThemedText
                      style={[
                        styles.charCountText,
                        {
                          color: textColor,
                          opacity: reviewText.length > 500 ? 0.8 : 0.4,
                        },
                      ]}>
                      {reviewText.length} / 2000
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.spoilerToggle, { borderColor }]}
                  onPress={() => setHasSpoiler(!hasSpoiler)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={hasSpoiler ? 'warning' : 'warning-outline'}
                    size={20}
                    color={hasSpoiler ? '#FF9500' : textColor + '60'}
                  />
                  <ThemedText
                    style={[
                      styles.spoilerText,
                      {
                        color: hasSpoiler ? '#FF9500' : textColor + '60',
                        fontWeight: hasSpoiler ? '600' : '400',
                      },
                    ]}>
                    Contém spoilers
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {showPreview && selectedBook && reviewText.trim().length > 0 && (
                <ThemedView style={[styles.previewSection, { borderColor, backgroundColor }]}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Preview
                  </ThemedText>
                  <View style={[styles.previewCard, { borderColor }]}>
                    <View style={styles.previewHeader}>
                      <View style={[styles.previewAvatar, { backgroundColor: tintColor + '20' }]}>
                        <Ionicons name="person" size={20} color={tintColor} />
                      </View>
                      <View style={styles.previewUserInfo}>
                        <ThemedText style={[styles.previewUserName, { color: textColor }]}>
                          Você
                        </ThemedText>
                        <ThemedText style={[styles.previewTime, { color: textColor, opacity: 0.5 }]}>
                          Agora
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.previewBookInfo}>
                      {selectedBook.coverUrl && (
                        <Image source={{ uri: selectedBook.coverUrl }} style={styles.previewBookCover} />
                      )}
                      <View style={styles.previewBookDetails}>
                        <ThemedText style={[styles.previewBookTitle, { color: textColor }]} numberOfLines={2}>
                          {selectedBook.title}
                        </ThemedText>
                        <ThemedText style={[styles.previewBookAuthor, { color: textColor, opacity: 0.6 }]}>
                          {selectedBook.author}
                        </ThemedText>
                        {rating > 0 && (
                          <View style={styles.previewStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={star <= rating ? 'star' : 'star-outline'}
                                size={14}
                                color={tintColor}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                    {hasSpoiler && (
                      <View style={[styles.previewSpoilerWarning, { backgroundColor: '#FF9500' + '20' }]}>
                        <Ionicons name="warning" size={16} color="#FF9500" />
                        <ThemedText style={[styles.previewSpoilerText, { color: '#FF9500' }]}>
                          Contém spoilers
                        </ThemedText>
                      </View>
                    )}
                    <ThemedText style={[styles.previewContent, { color: textColor }]}>
                      {reviewText}
                    </ThemedText>
                  </View>
                </ThemedView>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BookSelector
        visible={showBookSearch}
        onClose={() => setShowBookSearch(false)}
        onBookSelect={handleBookSelect}
      />
    </SafeAreaView>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  selectBookButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  selectBookText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  bookCoverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bookAuthor: {
    fontSize: 14,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    marginTop: 4,
  },
  textInputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 200,
    position: 'relative',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    minHeight: 200,
  },
  charCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  charCountText: {
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tipsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  spoilerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  spoilerText: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 16,
    gap: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
  progressButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  progressButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  progressButtonText: {
    fontSize: 12,
  },
  previewSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewUserInfo: {
    flex: 1,
  },
  previewUserName: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewTime: {
    fontSize: 12,
  },
  previewBookInfo: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewBookCover: {
    width: 50,
    height: 75,
    borderRadius: 6,
  },
  previewBookDetails: {
    flex: 1,
    gap: 4,
  },
  previewBookTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewBookAuthor: {
    fontSize: 13,
  },
  previewStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  previewSpoilerWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  previewSpoilerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewContent: {
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});

