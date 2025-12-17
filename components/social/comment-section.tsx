import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { PremiumBadge } from '@/components/premium-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CommentsService } from '@/services/comments.service';
import { PointsService } from '@/services/points.service';
import type { Comment } from '@/types';
import { logger } from '@/utils/logger';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
  onUserPress?: (userId: string) => void;
}

interface CommentItemProps {
  comment: Comment;
  isOwnComment: boolean;
  isReply?: boolean;
  onToggleLike: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  onUserPress?: (userId: string) => void;
  backgroundColor: string;
  textColor: string;
  tintColor: string;
  borderColor: string;
  isDark: boolean;
  editingCommentId: string | null;
  editingText: string;
  setEditingText: (text: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  optionsCommentId: string | null;
  setOptionsCommentId: (id: string | null) => void;
  replyingToCommentId: string | null;
  setReplyingToCommentId: (id: string | null) => void;
  repliesCount?: number;
  isRepliesExpanded?: boolean;
  onToggleReplies?: () => void;
  showReplies?: boolean;
  replies?: Comment[];
  onReplyToggleLike?: (commentId: string) => void;
  onReplyReply?: (comment: Comment) => void;
  onReplyEdit?: (comment: Comment) => void;
  onReplyDelete?: (commentId: string) => void;
  onReplyUserPress?: (userId: string) => void;
  currentUser?: any;
}

function CommentItem({
  comment,
  isOwnComment,
  isReply = false,
  onToggleLike,
  onReply,
  onEdit,
  onDelete,
  onUserPress,
  backgroundColor,
  textColor,
  tintColor,
  borderColor,
  isDark,
  editingCommentId,
  editingText,
  setEditingText,
  handleSaveEdit,
  handleCancelEdit,
  optionsCommentId,
  setOptionsCommentId,
  replyingToCommentId,
  setReplyingToCommentId,
  repliesCount = 0,
  isRepliesExpanded = false,
  onToggleReplies,
  showReplies = false,
  replies,
  onReplyToggleLike,
  onReplyReply,
  onReplyEdit,
  onReplyDelete,
  onReplyUserPress,
  currentUser,
}: CommentItemProps) {
  const relativeTime = useRelativeTime(comment.createdAt);

  // Generate initials for avatar placeholder
  const initials = comment.userName
    ? comment.userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <>
      {!isReply && (
        <View style={[styles.commentItemWrapper, isReply && styles.commentItemWrapperReply]}>
          <ThemedView
            style={[
              styles.commentItem,
              {
                borderColor: isOwnComment ? tintColor + '30' : borderColor,
                backgroundColor: isOwnComment
                  ? (isDark ? tintColor + '10' : tintColor + '08')
                  : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'),
                borderBottomLeftRadius: showReplies && replies && replies.length > 0 ? 0 : 16,
                borderBottomRightRadius: showReplies && replies && replies.length > 0 ? 0 : 16,
                borderBottomWidth: showReplies && replies && replies.length > 0 ? 0 : 1,
              },
            ]}>
        {/* Header Section */}
        <View style={[styles.commentHeaderContainer, isReply && styles.commentHeaderContainerReply]}>
          <TouchableOpacity
            style={styles.commentHeader}
            onPress={() => onUserPress?.(comment.userId)}
            activeOpacity={0.7}
            disabled={!onUserPress}>
            {comment.userAvatar ? (
              <View
                style={[
                  isReply ? styles.avatarContainerReply : styles.avatarContainer,
                  { borderColor: isOwnComment ? tintColor + '40' : borderColor },
                ]}>
                <Image
                  source={{
                    uri: comment.userAvatar.includes('?t=')
                      ? comment.userAvatar
                      : `${comment.userAvatar}?t=${Date.now()}`,
                  }}
                  style={isReply ? styles.avatarReply : styles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </View>
            ) : (
              <ThemedView
                style={[
                  isReply ? styles.avatarPlaceholderReply : styles.avatarPlaceholder,
                  {
                    backgroundColor: isOwnComment ? tintColor + '25' : tintColor + '20',
                    borderColor: isOwnComment ? tintColor + '40' : borderColor,
                  },
                ]}>
                <ThemedText style={[isReply ? styles.avatarTextReply : styles.avatarText, { color: tintColor }]}>
                  {initials}
                </ThemedText>
              </ThemedView>
            )}
            <View style={styles.commentUserInfo}>
              <View style={styles.commentUserTopRow}>
                <View style={styles.commentNameWithBadge}>
                  <ThemedText
                    style={[
                      isReply ? styles.commentUserNameReply : styles.commentUserName,
                      {
                        color: isOwnComment ? tintColor : textColor,
                        fontWeight: isOwnComment ? '700' : '600',
                      },
                    ]}
                    numberOfLines={1}>
                    {comment.userName}
                  </ThemedText>
                  {comment.userIsPremium && (
                    <PremiumBadge size="small" style={styles.commentPremiumBadge} />
                  )}
                </View>
                {isOwnComment && !isReply && (
                  <ThemedView style={[styles.ownCommentBadgeContainer, { backgroundColor: tintColor + '20' }]}>
                    <ThemedText style={[styles.ownCommentBadge, { color: tintColor }]}>
                      você
                    </ThemedText>
                  </ThemedView>
                )}
              </View>
              {!isReply && (
                <ThemedText style={[styles.commentTime, { color: textColor, opacity: 0.6 }]}>
                  {relativeTime}
                </ThemedText>
              )}
            </View>
          </TouchableOpacity>
          {isOwnComment && !isReply && (
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={(e) => {
                e.stopPropagation();
                setOptionsCommentId(optionsCommentId === comment.id ? null : comment.id);
              }}
              activeOpacity={0.7}>
              <Ionicons name="ellipsis-vertical" size={20} color={textColor + '70'} />
            </TouchableOpacity>
          )}
        </View>
        {/* Content Section */}
        <View style={[styles.commentContentContainer, isReply && styles.commentContentContainerReply]}>
          {comment.parentCommentUserName && (
            <TouchableOpacity
              style={[styles.replyToBadge, isReply && styles.replyToBadgeReply, { backgroundColor: tintColor + '10' }]}
              onPress={() => {
                // Could scroll to parent comment if needed
              }}
              activeOpacity={0.7}>
              <Ionicons name="arrow-undo" size={isReply ? 10 : 12} color={tintColor} />
              <ThemedText style={[styles.replyToText, isReply && styles.replyToTextReply, { color: tintColor }]}>
                {comment.parentCommentUserUsername ? `@${comment.parentCommentUserUsername}` : comment.parentCommentUserName}
              </ThemedText>
            </TouchableOpacity>
          )}
          {editingCommentId === comment.id ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    color: textColor,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: borderColor,
                  },
                ]}
                value={editingText}
                onChangeText={setEditingText}
                multiline
                autoFocus
                placeholderTextColor={textColor + '50'}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton, { borderColor: borderColor }]}
                  onPress={handleCancelEdit}
                  activeOpacity={0.7}>
                  <ThemedText style={[styles.editButtonText, { color: textColor }]}>Cancelar</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton, { backgroundColor: tintColor }]}
                  onPress={handleSaveEdit}
                  activeOpacity={0.7}>
                  <ThemedText style={[styles.editButtonText, { color: '#FFFFFF' }]}>Salvar</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ThemedText
              style={[
                isReply ? styles.commentContentReply : styles.commentContent,
                {
                  color: textColor,
                },
              ]}>
              {comment.content}
            </ThemedText>
          )}
        </View>

        {/* Actions Section */}
        {!isReply ? (
          <View style={[styles.commentActions, { borderTopColor: borderColor }]}>
            <TouchableOpacity
              style={[
                styles.commentActionButton,
                {
                  backgroundColor: comment.isLiked ? '#FF3B30' + '15' : 'transparent',
                },
              ]}
              onPress={() => onToggleLike(comment.id)}
              activeOpacity={0.7}>
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={comment.isLiked ? '#FF3B30' : textColor + '70'}
              />
              <ThemedText
                style={[
                  styles.commentActionText,
                  {
                    color: comment.isLiked ? '#FF3B30' : textColor + '70',
                    fontWeight: comment.isLiked ? '600' : '500',
                  },
                ]}>
                {comment.likesCount > 0 ? comment.likesCount : 'Curtir'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.commentActionButton}
              onPress={() => onReply(comment)}
              activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={18} color={textColor + '70'} />
              <ThemedText style={[styles.commentActionText, { color: textColor + '70' }]}>
                Responder
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.commentActionsReply, { borderTopColor: borderColor }]}>
            <TouchableOpacity
              style={styles.commentActionButtonReply}
              onPress={() => onToggleLike(comment.id)}
              activeOpacity={0.7}>
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={14}
                color={comment.isLiked ? '#FF3B30' : textColor + '60'}
              />
              {comment.likesCount > 0 && (
                <ThemedText
                  style={[
                    styles.commentActionTextReply,
                    {
                      color: comment.isLiked ? '#FF3B30' : textColor + '60',
                    },
                  ]}>
                  {comment.likesCount}
                </ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.commentActionButtonReply}
              onPress={() => onReply(comment)}
              activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={14} color={textColor + '60'} />
            </TouchableOpacity>
          </View>
        )}
        {/* Replies toggle button - inside the comment card */}
        {!isReply && repliesCount > 0 && onToggleReplies && (
          <TouchableOpacity
            style={[styles.repliesToggleButton, { borderColor: borderColor, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }]}
            onPress={onToggleReplies}
            activeOpacity={0.7}>
            <View style={styles.repliesToggleContent}>
              <Ionicons
                name={isRepliesExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={tintColor}
              />
              <ThemedText style={[styles.repliesToggleText, { color: tintColor }]}>
                {isRepliesExpanded
                  ? `Ocultar ${repliesCount} resposta${repliesCount > 1 ? 's' : ''}`
                  : `Ver ${repliesCount} resposta${repliesCount > 1 ? 's' : ''}`}
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}
      </ThemedView>
      {/* Render replies as extension of the main comment card */}
      {!isReply && showReplies && replies && replies.length > 0 && (
        <View style={[styles.repliesExtensionContainer, { borderColor: borderColor, backgroundColor: isOwnComment ? (isDark ? tintColor + '10' : tintColor + '08') : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)') }]}>
          {replies.map((reply, index) => {
            const isOwnReply = !!(currentUser && reply.userId === currentUser.id);
            return (
              <View key={reply.id} style={[styles.replyExtensionItem, index === replies.length - 1 && styles.replyExtensionItemLast]}>
                <View style={styles.replyContentWrapper}>
                  <View style={[styles.replyIndicator, { backgroundColor: borderColor }]} />
                  <View style={[styles.replyContent, { flex: 1 }]}>
                    <View style={[styles.commentHeaderContainer, styles.commentHeaderContainerReply]}>
                      <TouchableOpacity
                        style={styles.commentHeader}
                        onPress={() => onReplyUserPress?.(reply.userId)}
                        activeOpacity={0.7}
                        disabled={!onReplyUserPress}>
                        {reply.userAvatar ? (
                          <View style={[styles.avatarContainerReply, { borderColor: isOwnReply ? tintColor + '40' : borderColor }]}>
                            <Image
                              source={{
                                uri: reply.userAvatar.includes('?t=')
                                  ? reply.userAvatar
                                  : `${reply.userAvatar}?t=${Date.now()}`,
                              }}
                              style={styles.avatarReply}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          </View>
                        ) : (
                          <ThemedView
                            style={[
                              styles.avatarPlaceholderReply,
                              {
                                backgroundColor: isOwnReply ? tintColor + '25' : tintColor + '20',
                                borderColor: isOwnReply ? tintColor + '40' : borderColor,
                              },
                            ]}>
                            <ThemedText style={[styles.avatarTextReply, { color: tintColor }]}>
                              {reply.userName
                                ? reply.userName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)
                                : 'U'}
                            </ThemedText>
                          </ThemedView>
                        )}
                        <View style={styles.commentUserInfo}>
                          <View style={styles.commentUserTopRow}>
                            <ThemedText
                              style={[
                                styles.commentUserNameReply,
                                {
                                  color: isOwnReply ? tintColor : textColor,
                                  fontWeight: isOwnReply ? '700' : '600',
                                },
                              ]}
                              numberOfLines={1}>
                              {reply.userName}
                            </ThemedText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                    {reply.parentCommentUserName && (
                      <TouchableOpacity
                        style={[styles.replyToBadge, styles.replyToBadgeReply, { backgroundColor: tintColor + '10' }]}
                        activeOpacity={0.7}>
                        <Ionicons name="arrow-undo" size={10} color={tintColor} />
                        <ThemedText style={[styles.replyToTextReply, { color: tintColor }]}>
                          {reply.parentCommentUserUsername ? `@${reply.parentCommentUserUsername}` : reply.parentCommentUserName}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                    <ThemedText
                      style={[
                        styles.commentContentReply,
                        {
                          color: textColor,
                        },
                      ]}>
                      {reply.content}
                    </ThemedText>
                    <View style={[styles.commentActionsReply, { borderTopColor: borderColor }]}>
                      <TouchableOpacity
                        style={styles.commentActionButtonReply}
                        onPress={() => onReplyToggleLike?.(reply.id)}
                        activeOpacity={0.7}>
                        <Ionicons
                          name={reply.isLiked ? 'heart' : 'heart-outline'}
                          size={14}
                          color={reply.isLiked ? '#FF3B30' : textColor + '60'}
                        />
                        {reply.likesCount > 0 && (
                          <ThemedText
                            style={[
                              styles.commentActionTextReply,
                              {
                                color: reply.isLiked ? '#FF3B30' : textColor + '60',
                              },
                            ]}>
                            {reply.likesCount}
                          </ThemedText>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.commentActionButtonReply}
                        onPress={() => onReplyReply?.(reply)}
                        activeOpacity={0.7}>
                        <Ionicons name="chatbubble-outline" size={14} color={textColor + '60'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
        </View>
      )}
      {isReply && (
        <View style={[styles.commentItemWrapper, styles.commentItemWrapperReply]}>
          <View style={[styles.replyIndicator, { backgroundColor: borderColor }]} />
          <ThemedView
            style={[
              styles.commentItem,
              styles.commentItemReply,
              {
                borderColor: isOwnComment ? tintColor + '30' : borderColor,
                backgroundColor: isOwnComment
                  ? (isDark ? tintColor + '10' : tintColor + '08')
                  : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'),
                marginLeft: 20,
              },
            ]}>
            {/* Header Section */}
            <View style={[styles.commentHeaderContainer, styles.commentHeaderContainerReply]}>
              <TouchableOpacity
                style={styles.commentHeader}
                onPress={() => onUserPress?.(comment.userId)}
                activeOpacity={0.7}
                disabled={!onUserPress}>
                {comment.userAvatar ? (
                  <View
                    style={[
                      styles.avatarContainerReply,
                      { borderColor: isOwnComment ? tintColor + '40' : borderColor },
                    ]}>
                    <Image
                      source={{
                        uri: comment.userAvatar.includes('?t=')
                          ? comment.userAvatar
                          : `${comment.userAvatar}?t=${Date.now()}`,
                      }}
                      style={styles.avatarReply}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                ) : (
                  <ThemedView
                    style={[
                      styles.avatarPlaceholderReply,
                      {
                        backgroundColor: isOwnComment ? tintColor + '25' : tintColor + '20',
                        borderColor: isOwnComment ? tintColor + '40' : borderColor,
                      },
                    ]}>
                    <ThemedText style={[styles.avatarTextReply, { color: tintColor }]}>
                      {initials}
                    </ThemedText>
                  </ThemedView>
                )}
                <View style={styles.commentUserInfo}>
                  <View style={styles.commentUserTopRow}>
                    <ThemedText
                      style={[
                        styles.commentUserNameReply,
                        {
                          color: isOwnComment ? tintColor : textColor,
                          fontWeight: isOwnComment ? '700' : '600',
                        },
                      ]}
                      numberOfLines={1}>
                      {comment.userName}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            {/* Content Section */}
            <View style={[styles.commentContentContainer, styles.commentContentContainerReply]}>
              {comment.parentCommentUserName && (
                <TouchableOpacity
                  style={[styles.replyToBadge, styles.replyToBadgeReply, { backgroundColor: tintColor + '10' }]}
                  onPress={() => {
                    // Could scroll to parent comment if needed
                  }}
                  activeOpacity={0.7}>
                  <Ionicons name="arrow-undo" size={10} color={tintColor} />
                  <ThemedText style={[styles.replyToTextReply, { color: tintColor }]}>
                    {comment.parentCommentUserUsername ? `@${comment.parentCommentUserUsername}` : comment.parentCommentUserName}
                  </ThemedText>
                </TouchableOpacity>
              )}
              {editingCommentId === comment.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        color: textColor,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: borderColor,
                      },
                    ]}
                    value={editingText}
                    onChangeText={setEditingText}
                    multiline
                    autoFocus
                    placeholderTextColor={textColor + '50'}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[styles.editButton, styles.cancelButton, { borderColor: borderColor }]}
                      onPress={handleCancelEdit}
                      activeOpacity={0.7}>
                      <ThemedText style={[styles.editButtonText, { color: textColor }]}>Cancelar</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveButton, { backgroundColor: tintColor }]}
                      onPress={handleSaveEdit}
                      activeOpacity={0.7}>
                      <ThemedText style={[styles.editButtonText, { color: '#FFFFFF' }]}>Salvar</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <ThemedText
                  style={[
                    styles.commentContentReply,
                    {
                      color: textColor,
                    },
                  ]}>
                  {comment.content}
                </ThemedText>
              )}
            </View>
            {/* Actions Section */}
            <View style={[styles.commentActionsReply, { borderTopColor: borderColor }]}>
              <TouchableOpacity
                style={styles.commentActionButtonReply}
                onPress={() => onToggleLike(comment.id)}
                activeOpacity={0.7}>
                <Ionicons
                  name={comment.isLiked ? 'heart' : 'heart-outline'}
                  size={14}
                  color={comment.isLiked ? '#FF3B30' : textColor + '60'}
                />
                {comment.likesCount > 0 && (
                  <ThemedText
                    style={[
                      styles.commentActionTextReply,
                      {
                        color: comment.isLiked ? '#FF3B30' : textColor + '60',
                      },
                    ]}>
                    {comment.likesCount}
                  </ThemedText>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentActionButtonReply}
                onPress={() => onReply(comment)}
                activeOpacity={0.7}>
                <Ionicons name="chatbubble-outline" size={14} color={textColor + '60'} />
              </TouchableOpacity>
            </View>
          </ThemedView>
          {isOwnComment && optionsCommentId === comment.id && (
            <View style={[styles.optionsMenu, { backgroundColor: backgroundColor, borderColor: borderColor }]}>
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={() => {
                  setOptionsCommentId(null);
                  onEdit?.(comment);
                }}
                activeOpacity={0.7}>
                <Ionicons name="pencil-outline" size={18} color={textColor} />
                <ThemedText style={[styles.optionsMenuText, { color: textColor }]}>Editar</ThemedText>
              </TouchableOpacity>
              <View style={[styles.optionsMenuDivider, { backgroundColor: borderColor }]} />
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={() => {
                  setOptionsCommentId(null);
                  onDelete?.(comment.id);
                }}
                activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                <ThemedText style={[styles.optionsMenuText, { color: '#FF3B30' }]}>Apagar</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </>
  );
}

export function CommentSection({ postId, onCommentAdded, onUserPress }: CommentSectionProps) {
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [optionsCommentId, setOptionsCommentId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

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
        parentCommentId: replyingToCommentId || undefined,
      });

      // Award points for creating comment
      await PointsService.awardPoints(user.id, 'comment_created', newComment.id);

      // Reload comments to get the updated tree structure
      await loadComments();
      setCommentText('');
      setReplyingToCommentId(null);
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

  const handleReply = (comment: Comment) => {
    setReplyingToCommentId(comment.id);
    if (comment.userUsername) {
      setCommentText(`@${comment.userUsername} `);
    } else if (comment.userName) {
      setCommentText(`@${comment.userName} `);
    }
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setCommentText('');
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editingText.trim()) {
      Alert.alert('Atenção', 'Por favor, escreva um comentário.');
      return;
    }

    try {
      const updatedComment = await CommentsService.updateComment(editingCommentId, editingText.trim());
      setComments((prev) =>
        prev.map((comment) => (comment.id === editingCommentId ? updatedComment : comment))
      );
      setEditingCommentId(null);
      setEditingText('');
    } catch (error) {
      logger.error('Error updating comment', error);
      Alert.alert('Erro', 'Não foi possível editar o comentário.');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleDelete = async (commentId: string) => {
    Alert.alert(
      'Apagar comentário',
      'Tem certeza que deseja apagar este comentário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              await CommentsService.deleteComment(commentId);
              setComments((prev) => prev.filter((comment) => comment.id !== commentId));
              onCommentAdded?.(); // Update comment count
            } catch (error) {
              logger.error('Error deleting comment', error);
              Alert.alert('Erro', 'Não foi possível apagar o comentário.');
            }
          },
        },
      ]
    );
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  return (
    <Pressable
      onPress={() => setOptionsCommentId(null)}
      style={{ flex: 1 }}>
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
            comments.map((comment) => {
              const isOwnComment = !!(user && comment.userId === user.id);
              const isExpanded = expandedReplies.has(comment.id);
              return (
                <View key={comment.id} style={styles.commentWithRepliesWrapper}>
                  <CommentItem
                    comment={comment}
                    isOwnComment={isOwnComment}
                    isReply={false}
                    onToggleLike={handleToggleLike}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUserPress={onUserPress}
                    backgroundColor={backgroundColor}
                    textColor={textColor}
                    tintColor={tintColor}
                    borderColor={borderColor}
                    isDark={isDark}
                    editingCommentId={editingCommentId}
                    editingText={editingText}
                    setEditingText={setEditingText}
                    handleSaveEdit={handleSaveEdit}
                    handleCancelEdit={handleCancelEdit}
                    optionsCommentId={optionsCommentId}
                    setOptionsCommentId={setOptionsCommentId}
                    replyingToCommentId={replyingToCommentId}
                    setReplyingToCommentId={setReplyingToCommentId}
                    repliesCount={comment.replies?.length || 0}
                    isRepliesExpanded={isExpanded}
                    onToggleReplies={() => toggleReplies(comment.id)}
                    showReplies={isExpanded}
                    replies={isExpanded ? comment.replies : undefined}
                    onReplyToggleLike={handleToggleLike}
                    onReplyReply={handleReply}
                    onReplyEdit={handleEdit}
                    onReplyDelete={handleDelete}
                    onReplyUserPress={onUserPress}
                    currentUser={user}
                  />
              </View>
              );
            })
          )}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {replyingToCommentId && (
          <View style={[styles.replyingToContainer, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
            <ThemedText style={[styles.replyingToLabel, { color: tintColor }]}>
              Respondendo a um comentário
            </ThemedText>
            <TouchableOpacity onPress={handleCancelReply} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color={tintColor} />
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.inputContainer, { borderColor, backgroundColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder={replyingToCommentId ? "Escreva uma resposta..." : "Escreva um comentário..."}
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
    </Pressable>
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
  commentItemWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  commentWithRepliesWrapper: {
    marginBottom: 16,
  },
  commentItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  commentItemReply: {
    padding: 10,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  commentHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commentHeaderContainerReply: {
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  commentHeaderReply: {
    gap: 8,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainerReply: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  avatarReply: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholderReply: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  avatarTextReply: {
    fontSize: 12,
    fontWeight: '700',
  },
  commentUserInfo: {
    flex: 1,
    gap: 4,
  },
  commentUserTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  commentNameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentPremiumBadge: {
    marginTop: 0,
    alignSelf: 'center',
  },
  commentUserName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  commentUserNameReply: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  ownCommentBadgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ownCommentBadge: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  commentTime: {
    fontSize: 12,
    fontWeight: '400',
  },
  commentContentContainer: {
    marginBottom: 12,
  },
  commentContentContainerReply: {
    marginBottom: 8,
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  commentContentReply: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentActionsReply: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentActionButtonReply: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  commentActionTextReply: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  commentActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
    paddingVertical: 6,
    minHeight: 20,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editContainer: {
    marginTop: 8,
    gap: 8,
    paddingLeft: 50,
  },
  editInput: {
    minHeight: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  saveButton: {
    // backgroundColor set inline
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  optionsMenu: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionsMenuDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  optionsMenuText: {
    fontSize: 15,
    fontWeight: '500',
  },
  commentItemWrapperReply: {
    marginBottom: 8,
  },
  replyIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
    zIndex: 1,
  },
  repliesContainer: {
    marginTop: 6,
    paddingLeft: 16,
  },
  repliesExtensionContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: 0,
    paddingLeft: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  replyConnectionLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  replyExtensionItem: {
    marginBottom: 8,
  },
  replyExtensionItemLast: {
    marginBottom: 0,
  },
  replyContentWrapper: {
    flexDirection: 'row',
    position: 'relative',
  },
  replyContent: {
    flex: 1,
    marginLeft: 12,
  },
  replyToBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  replyToBadgeReply: {
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  replyToText: {
    fontSize: 13,
    fontWeight: '600',
  },
  replyToTextReply: {
    fontSize: 11,
    fontWeight: '600',
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  replyingToLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  repliesToggleButton: {
    marginTop: 6,
    marginBottom: 0,
    marginLeft: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  repliesToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repliesToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

