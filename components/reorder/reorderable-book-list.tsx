

import React, { useEffect, useRef } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

import { DraggableList } from '@/components/draggable-list';
import { SwipeableBookCard } from '@/components/swipeable-book-card';
import { ThemedView } from '@/components/themed-view';
import { useReorderBooks } from '@/hooks/use-reorder-books';
import type { Book } from '@/types';

export interface ReorderableBookListProps {
  books: Book[];
  scrollViewRef: React.RefObject<ScrollView | null>;
  selectedBookIds: Set<string>;
  selectionMode: boolean;
  backgroundColor: string;
  textColor: string;
  tintColor: string;
  onBookPress: (book: Book) => void;
  onBookLongPress: (book: Book) => void;
  onBookOptions: (book: Book) => void;
  style?: ViewStyle;
  enabled?: boolean;
  onDraggingChange?: (isDragging: boolean) => void;
}

export function ReorderableBookList({
  books,
  scrollViewRef,
  selectedBookIds,
  selectionMode,
  backgroundColor,
  textColor,
  tintColor,
  onBookPress,
  onBookLongPress,
  onBookOptions,
  style,
  enabled = true,
  onDraggingChange,
}: ReorderableBookListProps) {
  const currentScrollYRef = useRef(0);

  const {
    reorderedBooks,
    reorderingBookId,
    isDragging,
    startReordering,
    cancelReordering,
    handleReorder,
    handleDragStart,
    handleDragEnd,
  } = useReorderBooks({
    books,
    enabled: enabled && !selectionMode,
  });

  useEffect(() => {
    onDraggingChange?.(isDragging);
  }, [isDragging, onDraggingChange]);

  const handleReorderPress = (book: Book) => {
    const isReordering = reorderingBookId === book.id;
    if (isReordering) {
      cancelReordering();
    } else {
      startReordering(book.id);
    }
  };

  const handleBookPress = (book: Book) => {
    const isReordering = reorderingBookId === book.id;
    if (isReordering) {
      cancelReordering();
    } else {
      onBookPress(book);
    }
  };

  if (reorderingBookId) {
    return (
      <DraggableList
        items={reorderedBooks.length > 0 ? reorderedBooks : books}
        keyExtractor={(book) => book.id}
        scrollViewRef={scrollViewRef as React.RefObject<ScrollView>}
        onScrollUpdate={(scrollY) => {
          currentScrollYRef.current = scrollY;
        }}
        getCurrentScrollY={() => currentScrollYRef.current}
        renderItem={(book, index, isDraggingItem, isHoverTarget, dragHandleProps) => {
          const isSelected = selectedBookIds.has(book.id);
          const isReordering = reorderingBookId === book.id;
          return (
            <SwipeableBookCard
              key={book.id}
              book={book}
              isSelected={isSelected}
              isDragging={isDraggingItem}
              isHoverTarget={isHoverTarget}
              selectionMode={selectionMode}
              backgroundColor={backgroundColor}
              textColor={textColor}
              tintColor={tintColor}
              onPress={() => handleBookPress(book)}
              onLongPress={() => onBookLongPress(book)}
              onOptionsPress={() => onBookOptions(book)}
              onReorderPress={() => handleReorderPress(book)}
              dragHandleProps={isReordering ? dragHandleProps : undefined}
              isReordering={isReordering}
            />
          );
        }}
        onReorder={handleReorder}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        itemHeight={112}
        disabled={selectionMode}
        style={style}
      />
    );
  }

  return (
    <ThemedView style={style}>
      {books.map((book) => {
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
            onPress={() => onBookPress(book)}
            onLongPress={() => onBookLongPress(book)}
            onOptionsPress={() => onBookOptions(book)}
            onReorderPress={() => handleReorderPress(book)}
            dragHandleProps={undefined}
            isReordering={false}
          />
        );
      })}
    </ThemedView>
  );
}

