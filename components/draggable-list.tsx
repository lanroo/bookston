
import type { DragHandleProps } from '@/types';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

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
  scrollViewRef?: React.RefObject<ScrollView | null>;
  onScrollUpdate?: (scrollY: number) => void;
  getCurrentScrollY?: () => number;
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
  scrollViewRef,
  onScrollUpdate,
  getCurrentScrollY,
}: DraggableListProps<T>) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  
  const dragStartY = useRef(0);
  const dragStartIndexRef = useRef<number>(0);
  const containerRef = useRef<View>(null);
  const gap = 12;
  const autoScrollIntervalRef = useRef<number | null>(null);
  const scrollViewLayoutRef = useRef<{ y: number; height: number } | null>(null);
  const currentScrollYRef = useRef(0);

  const getCurrentDragIndex = useCallback((): number | null => {
    if (!draggedItemId) return null;
    const index = items.findIndex((item, idx) => keyExtractor(item, idx) === draggedItemId);
    return index >= 0 ? index : null;
  }, [items, draggedItemId, keyExtractor]);

  const calculateTargetIndex = useCallback(
    (currentY: number, currentIndex: number): number => {
      const offset = currentY - dragStartY.current;
      const itemHeightWithGap = itemHeight + gap;
      
      const indexOffset = Math.floor(offset / itemHeightWithGap);
      const targetIndex = dragStartIndexRef.current + indexOffset;
      
      const clamped = Math.max(0, Math.min(items.length - 1, targetIndex));
      
      console.log('[CALCULATE TARGET]', {
        currentY,
        dragStartY: dragStartY.current,
        offset,
        itemHeightWithGap,
        indexOffset,
        dragStartIndex: dragStartIndexRef.current,
        targetIndex,
        clamped,
        currentIndex,
      });
      
      return clamped;
    },
    [items.length, itemHeight, gap]
  );

  const handleDragStart = useCallback((index: number, startY: number) => {
    if (disabled) return;
    const itemId = keyExtractor(items[index], index);
    console.log('[DRAG START]', {
      index,
      itemId,
      startY,
      totalItems: items.length,
    });
    setDraggedItemId(itemId);
    dragStartIndexRef.current = index;
    dragStartY.current = startY;
    setHoverIndex(null);
    setDragY(0);
    
    if (scrollViewRef?.current) {
      const nodeHandle = (scrollViewRef.current as any).getNode?.() || scrollViewRef.current;
      if (nodeHandle && nodeHandle.measureInWindow) {
        nodeHandle.measureInWindow((x: number, y: number, width: number, height: number) => {
          scrollViewLayoutRef.current = { y, height };
        });
      } else {
        const { Dimensions } = require('react-native');
        const { height: screenHeight } = Dimensions.get('window');
        scrollViewLayoutRef.current = { y: 0, height: screenHeight };
      }
    }
    
    if (getCurrentScrollY) {
      currentScrollYRef.current = getCurrentScrollY();
    }
    
    onDragStart?.();
  }, [disabled, onDragStart, items, keyExtractor, scrollViewRef, onScrollUpdate, getCurrentScrollY]);

  const handleAutoScroll = useCallback(
    (currentY: number) => {
      if (!scrollViewRef?.current || !scrollViewLayoutRef.current) return;

      const { y: scrollViewY, height: scrollViewHeight } = scrollViewLayoutRef.current;
      const scrollViewTop = scrollViewY;
      const scrollViewBottom = scrollViewY + scrollViewHeight;
      
      const scrollTriggerZone = 100;
      const scrollSpeed = 8;

      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }

      if (currentY < scrollViewTop + scrollTriggerZone) {
        const distanceFromEdge = currentY - scrollViewTop;
        const normalizedDistance = Math.max(0, Math.min(1, distanceFromEdge / scrollTriggerZone));
        const speed = scrollSpeed * (1 - normalizedDistance); // Faster when closer to edge
        
        autoScrollIntervalRef.current = setInterval(() => {
          if (scrollViewRef?.current) {
            const newScrollY = Math.max(0, currentScrollYRef.current - speed);
            currentScrollYRef.current = newScrollY;
            scrollViewRef.current.scrollTo({
              y: newScrollY,
              animated: false,
            });
            onScrollUpdate?.(newScrollY);
          }
        }, 16);
      }
      else if (currentY > scrollViewBottom - scrollTriggerZone) {
        const distanceFromEdge = scrollViewBottom - currentY;
        const normalizedDistance = Math.max(0, Math.min(1, distanceFromEdge / scrollTriggerZone));
        const speed = scrollSpeed * (1 - normalizedDistance); // Faster when closer to edge
        
        autoScrollIntervalRef.current = setInterval(() => {
          if (scrollViewRef?.current) {
            const newScrollY = currentScrollYRef.current + speed;
            currentScrollYRef.current = newScrollY;
            scrollViewRef.current.scrollTo({
              y: newScrollY,
              animated: false,
            });
            onScrollUpdate?.(newScrollY);
          }
        }, 16); 
      }
    },
    [scrollViewRef, onScrollUpdate]
  );

  const handleDragMove = useCallback(
    (currentY: number) => {
      if (disabled || !draggedItemId) return;


      const currentIndex = getCurrentDragIndex();
      if (currentIndex === null) return;

      if (scrollViewRef?.current) {
        const { y: scrollViewY, height: scrollViewHeight } = scrollViewLayoutRef.current || { y: 0, height: 0 };
        const scrollViewTop = scrollViewY;
        const scrollViewBottom = scrollViewY + scrollViewHeight;
        const scrollTriggerZone = 100;
        
        if (currentY < scrollViewTop + scrollTriggerZone || currentY > scrollViewBottom - scrollTriggerZone) {
          handleAutoScroll(currentY);
        } else if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }
      }

      const offset = currentY - dragStartY.current;
      const targetIndex = calculateTargetIndex(currentY, currentIndex);
      
      console.log('[DRAG MOVE]', {
        currentY,
        dragStartY: dragStartY.current,
        offset,
        currentIndex,
        dragStartIndex: dragStartIndexRef.current,
        targetIndex,
        hoverIndex,
        itemHeight,
        gap,
        itemHeightWithGap: itemHeight + gap,
        indexOffset: Math.floor(offset / (itemHeight + gap)),
      });

      setDragY(offset);

      if (targetIndex !== currentIndex && targetIndex !== hoverIndex) {
        console.log('[REORDER]', {
          from: currentIndex,
          to: targetIndex,
          itemId: draggedItemId,
        });
        
        setHoverIndex(targetIndex);

        const newItems = [...items];
        const [removed] = newItems.splice(currentIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        dragStartIndexRef.current = targetIndex;
        
        const itemHeightWithGap = itemHeight + gap;
        const indexDelta = targetIndex - currentIndex;
        const previousDragStartY = dragStartY.current;
        dragStartY.current = dragStartY.current + (indexDelta * itemHeightWithGap);
        
        console.log('[UPDATE DRAG START]', {
          currentIndex,
          newIndex: targetIndex,
          indexDelta,
          previousDragStartY,
          newDragStartY: dragStartY.current,
        });

        onReorder(newItems);
      }
    },
    [disabled, draggedItemId, hoverIndex, items, calculateTargetIndex, onReorder, getCurrentDragIndex, itemHeight, gap, scrollViewRef, handleAutoScroll]
  );

  const handleDragEnd = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    setDraggedItemId(null);
    setDragY(0);
    setHoverIndex(null);
    dragStartY.current = 0;
    dragStartIndexRef.current = 0;
    scrollViewLayoutRef.current = null;
    onDragEnd?.();
  }, [onDragEnd]);

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      {items.map((item, index) => {
        const itemId = keyExtractor(item, index);
        const isDragging = draggedItemId === itemId;
        const isHoverTarget = hoverIndex === index && draggedItemId !== null && !isDragging;

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
  onDragMove: (currentY: number) => void;
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
        onPanResponderGrant: (evt) => {
          startY.current = evt.nativeEvent.pageY;
          translateY.setOffset(0);
          translateY.setValue(0);
          onDragStart(index, evt.nativeEvent.pageY);
        },
        onPanResponderMove: (evt) => {
          const currentY = evt.nativeEvent.pageY;
          const offset = currentY - startY.current;
          translateY.setValue(offset);
          onDragMove(currentY);
        },
        onPanResponderRelease: () => {
          translateY.flattenOffset();
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
    [disabled, index, onDragStart, onDragMove, onDragEnd, onDragEndCallback, translateY]
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

