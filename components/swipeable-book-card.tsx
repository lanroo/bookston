import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';

import { BookCard, BookCardProps } from '@/components/book-card';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { DragHandleProps } from '@/types';

export interface SwipeableBookCardProps extends Omit<BookCardProps, 'dragHandleProps'> {
  onReorderPress: () => void;
  dragHandleProps?: DragHandleProps | null;
}

const SWIPE_THRESHOLD = 80;
const ACTION_BUTTON_WIDTH = 80;

export function SwipeableBookCard({
  onReorderPress,
  dragHandleProps,
  ...bookCardProps
}: SwipeableBookCardProps) {
  const tintColor = useThemeColor({}, 'tint');
  const translateX = useRef(new Animated.Value(0)).current;
  const actionButtonOpacity = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const isSwipeActive = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (bookCardProps.selectionMode) return false;
        
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const isLeftSwipe = gestureState.dx < -10;
        const hasEnoughMovement = Math.abs(gestureState.dx) > 15;
        
        if (isHorizontalSwipe && isLeftSwipe && hasEnoughMovement) {
          return true;
        }
        
        return false;
      },
      onPanResponderTerminationRequest: () => {
        return !isSwipeActive.current;
      },
      onPanResponderGrant: () => {
        isSwipeActive.current = true;
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isSwipeActive.current) return;
        
        const newValue = Math.min(0, lastOffset.current + gestureState.dx);
        translateX.setValue(newValue - lastOffset.current);
        
        const opacity = Math.min(1, Math.abs(newValue) / SWIPE_THRESHOLD);
        actionButtonOpacity.setValue(opacity);
      },
      onPanResponderRelease: (_, gestureState) => {
        isSwipeActive.current = false;
        const currentValue = lastOffset.current + gestureState.dx;
        translateX.flattenOffset();
        
        if (Math.abs(currentValue) > SWIPE_THRESHOLD && currentValue < 0) {
          lastOffset.current = -ACTION_BUTTON_WIDTH;
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: -ACTION_BUTTON_WIDTH,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(actionButtonOpacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
          ]).start();
        } else {
          lastOffset.current = 0;
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(actionButtonOpacity, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        isSwipeActive.current = false;
        translateX.flattenOffset();
        lastOffset.current = 0;
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(actionButtonOpacity, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      },
    })
  ).current;

  const handleActionPress = () => {
    isSwipeActive.current = false;
    lastOffset.current = 0;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(actionButtonOpacity, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    onReorderPress();
  };

  React.useEffect(() => {
    if (bookCardProps.selectionMode && lastOffset.current !== 0) {
      isSwipeActive.current = false;
      lastOffset.current = 0;
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(actionButtonOpacity, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [bookCardProps.selectionMode, translateX]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}>
        <BookCard {...bookCardProps} dragHandleProps={undefined} />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.actionButton,
          {
            opacity: actionButtonOpacity,
            backgroundColor: tintColor,
          },
        ]}>
        <TouchableOpacity
          style={styles.actionButtonContent}
          onPress={handleActionPress}
          activeOpacity={0.8}>
          <Ionicons name="reorder-three" size={28} color="#fff" />
          <Animated.Text style={styles.actionButtonText}>Reorganizar</Animated.Text>
        </TouchableOpacity>
      </Animated.View>
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
  actionButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

