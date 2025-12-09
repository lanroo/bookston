
import type { DragHandleProps } from '@/types';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View, ViewStyle } from 'react-native';

export interface DraggableItem<T> {
  id: string;
  data: T;
  index: number;
}

export interface DraggableListProps<T> {
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (
    item: T,
    index: number,
    isDragging: boolean,
    isHoverTarget: boolean,
    dragHandleProps: DragHandleProps | null
  ) => React.ReactNode;
  onReorder: (reorderedItems: T[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  itemHeight?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export function DraggableList<T>({
  items,
  keyExtractor,
  renderItem,
  onReorder,
  onDragStart,
  onDragEnd,
  itemHeight = 112,
  disabled = false,
  style,
}: DraggableListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  
  const dragStartY = useRef(0);
  const dragStartIndex = useRef(0);

  const calculateTargetIndex = useCallback(
    (currentY: number, startIndex: number): number => {
      const offset = currentY - dragStartY.current;
      const indexOffset = Math.round(offset / itemHeight);
      const targetIndex = startIndex + indexOffset;
      return Math.max(0, Math.min(items.length - 1, targetIndex));
    },
    [items.length, itemHeight]
  );

  const handleDragStart = useCallback((index: number, startY: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    dragStartIndex.current = index;
    dragStartY.current = startY;
    setHoverIndex(null);
    setDragY(0);
    onDragStart?.();
  }, [disabled, onDragStart]);

  const handleDragMove = useCallback(
    (currentY: number, startIndex: number) => {
      if (disabled || draggedIndex === null) return;

      const targetIndex = calculateTargetIndex(currentY, startIndex);
      const offset = currentY - dragStartY.current;
      setDragY(offset);

      if (targetIndex !== dragStartIndex.current && targetIndex !== hoverIndex) {
        setHoverIndex(targetIndex);

        const newItems = [...items];
        const [removed] = newItems.splice(dragStartIndex.current, 1);
        newItems.splice(targetIndex, 0, removed);

        dragStartIndex.current = targetIndex;

        onReorder(newItems);
      }
    },
    [disabled, draggedIndex, hoverIndex, items, calculateTargetIndex, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragY(0);
    setHoverIndex(null);
    dragStartY.current = 0;
    dragStartIndex.current = 0;
    onDragEnd?.();
  }, [onDragEnd]);

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => {
        const itemId = keyExtractor(item, index);
        const isDragging = draggedIndex === index;
        const isHoverTarget = hoverIndex === index && draggedIndex !== null && draggedIndex !== index;

        return (
          <DraggableItemWrapper
            key={itemId}
            index={index}
            isDragging={isDragging}
            isHoverTarget={isHoverTarget}
            dragY={isDragging ? dragY : 0}
            disabled={disabled}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragEndCallback={onDragEnd}
            renderItem={(dragHandleProps) =>
              renderItem(item, index, isDragging, isHoverTarget, dragHandleProps)
            }
          />
        );
      })}
    </View>
  );
}

interface DraggableItemWrapperProps {
  index: number;
  isDragging: boolean;
  isHoverTarget: boolean;
  dragY: number;
  disabled: boolean;
  onDragStart: (index: number, startY: number) => void;
  onDragMove: (currentY: number, startIndex: number) => void;
  onDragEnd: () => void;
  onDragEndCallback?: () => void;
        renderItem: (dragHandleProps: DragHandleProps | null) => React.ReactNode;
}

function DraggableItemWrapper({
  index,
  isDragging,
  isHoverTarget,
  dragY,
  disabled,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragEndCallback,
  renderItem,
}: DraggableItemWrapperProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const startY = useRef(0);

  React.useEffect(() => {
    if (isDragging) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.spring(opacity, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.spring(opacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
      ]).start();
    }
  }, [isDragging, scale, opacity]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return !disabled && Math.abs(gestureState.dy) > 5;
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderReject: () => {
          translateY.setValue(0);
        },
        onPanResponderGrant: (evt) => {
          startY.current = evt.nativeEvent.pageY;
          translateX.setOffset(0);
          translateY.setOffset(0);
          translateY.setValue(0);
          onDragStart(index, evt.nativeEvent.pageY);
        },
        onPanResponderMove: (evt) => {
          const currentY = evt.nativeEvent.pageY;
          const offset = currentY - startY.current;
          translateY.setValue(offset);
          onDragMove(currentY, index);
        },
        onPanResponderRelease: () => {
          translateY.flattenOffset();
          translateX.flattenOffset();
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }).start();
          onDragEnd();
          onDragEndCallback?.();
        },
        onPanResponderTerminate: () => {
          translateY.flattenOffset();
          translateX.flattenOffset();
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }).start();
          onDragEnd();
          onDragEndCallback?.();
        },
      }),
    [disabled, index, onDragStart, onDragMove, onDragEnd, onDragEndCallback, translateY, translateX]
  );

  return (
    <Animated.View
      style={[
        styles.itemWrapper,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          zIndex: isDragging ? 1000 : 1,
          elevation: isDragging ? 8 : 1,
        },
        isHoverTarget && styles.hoverTarget,
      ]}>
      {renderItem(panResponder.panHandlers)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  itemWrapper: {
    width: '100%',
  },
  hoverTarget: {
  },
});

