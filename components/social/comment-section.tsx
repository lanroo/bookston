import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CommentsService } from '@/services/comments.service';
import { PointsService } from '@/services/points.service';
import type { Comment } from '@/types';
import { logger } from '@/utils/logger';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CommentsService.getCommentsByPostId(postId);
      setComments(data);
    } catch (error) {
      logger.error('Error loading comments', error);
      Alert.alert('Erro', 'Não foi possível carregar os comentários.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Atenção', 'Por favor, escreva um comentário.');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para comentar.');
      return;
    }

    setSubmitting(true);
    try {
      const newComment = await CommentsService.createComment({
        postId,
        content: commentText.trim(),
      });

      // Award points for creating comment
      await PointsService.awardPoints(user.id, 'comment_created', newComment.id);

      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      onCommentAdded?.();
    } catch (error) {
      logger.error('Error creating comment', error);
      Alert.alert('Erro', 'Não foi possível criar o comentário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para curtir.');
      return;
    }

    try {
      const result = await CommentsService.toggleLike(commentId);

      if (result.isLiked) {
        await PointsService.awardPoints(user.id, 'comment_liked', commentId);
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, isLiked: result.isLiked, likesCount: result.likesCount }
            : comment
        )
      );
    } catch (error) {
      logger.error('Error toggling comment like', error);
    }
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor, borderColor }]}>
      <ThemedText style={[styles.title, { color: textColor }]}>
        Comentários ({comments.length})
      </ThemedText>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={tintColor} />
        </View>
      ) : (
        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={32} color={textColor} style={{ opacity: 0.3 }} />
              <ThemedText style={[styles.emptyText, { color: textColor, opacity: 0.5 }]}>
                Seja o primeiro a comentar!
              </ThemedText>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={[styles.commentItem, { borderColor }]}>
                <View style={styles.commentHeader}>
                  {comment.userAvatar ? (
                    <Image source={{ uri: comment.userAvatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
                      <Ionicons name="person" size={16} color={tintColor} />
                    </View>
                  )}
                  <View style={styles.commentUserInfo}>
                    <ThemedText style={[styles.commentUserName, { color: textColor }]}>
                      {comment.userName}
                    </ThemedText>
                    <ThemedText style={[styles.commentTime, { color: textColor, opacity: 0.5 }]}>
                      {formatRelativeDate(comment.createdAt)}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.commentContent, { color: textColor }]}>
                  {comment.content}
                </ThemedText>
                <TouchableOpacity
                  style={styles.commentLikeButton}
                  onPress={() => handleToggleLike(comment.id)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={comment.isLiked ? 'heart' : 'heart-outline'}
                    size={16}
                    color={comment.isLiked ? '#FF3B30' : textColor + '60'}
                  />
                  <ThemedText
                    style={[
                      styles.commentLikeText,
                      {
                        color: comment.isLiked ? '#FF3B30' : textColor + '60',
                      },
                    ]}>
                    {comment.likesCount > 0 ? comment.likesCount : ''}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={[styles.inputContainer, { borderColor, backgroundColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Escreva um comentário..."
            placeholderTextColor={isDark ? textColor + '40' : textColor + '50'}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
            style={[
              styles.submitButton,
              {
                backgroundColor: tintColor,
                opacity: commentText.trim() && !submitting ? 1 : 0.5,
              },
            ]}>
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  commentsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  commentItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 42,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 42,
    paddingVertical: 4,
  },
  commentLikeText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 4,
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

