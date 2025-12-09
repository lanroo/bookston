

import React, { useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { BookCard, BookCardProps } from '@/components/book-card';
import { ReorderButton } from '@/components/reorder/reorder-button';
import { useSwipeAction } from '@/hooks/use-swipe-action';
import type { DragHandleProps } from '@/types';

export interface SwipeableBookCardProps extends Omit<BookCardProps, 'dragHandleProps'> {
  onReorderPress: () => void;
  dragHandleProps?: DragHandleProps | null;
  isReordering?: boolean;
}

export function SwipeableBookCard({
  onReorderPress,
  dragHandleProps,
  isReordering = false,
  ...bookCardProps
}: SwipeableBookCardProps) {
  const {
    translateX,
    actionButtonOpacity,
    isSwiped,
    panHandlers,
    closeSwipe,
  } = useSwipeAction({
    selectionMode: bookCardProps.selectionMode,
    isReordering,
    onActionPress: onReorderPress,
  });

  const handleCardPress = () => {
    if (isReordering) {
      onReorderPress();
      return;
    }
    closeSwipe();
    bookCardProps.onPress();
  };

  useEffect(() => {
    if (bookCardProps.selectionMode) {
      closeSwipe();
    }
  }, [bookCardProps.selectionMode, closeSwipe]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
          },
        ]}
        {...(!isReordering ? panHandlers : {})}>
        <BookCard 
          {...bookCardProps} 
          dragHandleProps={isReordering ? dragHandleProps : undefined} 
          isSwiped={isSwiped}
          onPress={handleCardPress}
        />
      </Animated.View>
      
      {!isReordering && (
        <ReorderButton
          opacity={actionButtonOpacity}
          onPress={() => {
            closeSwipe();
            onReorderPress();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    width: '100%',
  },
});

