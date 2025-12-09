/**
 * ReorderBooksModal Component
 * Modal for reordering books with drag-and-drop
 * 
 * Single Responsibility: Manages book reordering UI
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DraggableList } from '@/components/draggable-list';
import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Book } from '@/types';
import { logger } from '@/utils/logger';
import { BookCard } from './book-card';

export interface ReorderBooksModalProps {
  visible: boolean;
  books: Book[];
  onClose: () => void;
  onSave: (reorderedBooks: Book[]) => Promise<void>;
}

export function ReorderBooksModal({
  visible,
  books,
  onClose,
  onSave,
}: ReorderBooksModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  
  const [reorderedBooks, setReorderedBooks] = useState<Book[]>(books);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  React.useEffect(() => {
    if (visible) {
      // Reset to original order when modal opens
      setReorderedBooks([...books]);
    }
  }, [visible, books]);

  const handleReorder = useCallback((newOrder: Book[]) => {
    // Update state immediately to reflect reordering
    setReorderedBooks(newOrder);
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(reorderedBooks);
      onClose();
    } catch (error) {
      logger.error('Error saving order', error, { bookCount: reorderedBooks.length });
    } finally {
      setSaving(false);
    }
  }, [reorderedBooks, onSave, onClose]);

  if (saving) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <LoadingScreen message="Salvando ordem..." />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: textColor + '10' }]}
            onPress={onClose}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Reorganizar Livros</ThemedText>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: tintColor }]}
            onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>Salvar</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Ionicons name="reorder-three-outline" size={20} color={textColor + '80'} />
          <ThemedText style={[styles.instructionsText, { color: textColor + '80' }]}>
            Arraste pelo ícone de reordenar para reorganizá-los
          </ThemedText>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isDragging}
          nestedScrollEnabled={true}>
          <DraggableList
            items={reorderedBooks}
            keyExtractor={(book) => book.id}
            renderItem={(book, index, isDraggingItem, isHoverTarget, dragHandleProps) => (
              <BookCard
                key={book.id}
                book={book}
                isSelected={false}
                isDragging={isDraggingItem}
                isHoverTarget={isHoverTarget}
                selectionMode={false}
                backgroundColor={backgroundColor}
                textColor={textColor}
                tintColor={tintColor}
                onPress={() => {}}
                onLongPress={() => {}}
                onOptionsPress={() => {}}
                dragHandleProps={dragHandleProps}
              />
            )}
            onReorder={handleReorder}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            itemHeight={112}
            disabled={false}
            style={styles.list}
          />
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  instructionsText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  list: {
    gap: 12,
  },
});

