import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
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
  const [isSwiped, setIsSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // Allow pan responder if button is already open
        if (lastOffset.current < 0) return true;
        return false;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (bookCardProps.selectionMode) return false;
        
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const hasEnoughMovement = Math.abs(gestureState.dx) > 10;
        
        // Allow horizontal swipe in both directions
        if (isHorizontalSwipe && hasEnoughMovement) {
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
        
        // Allow movement in both directions, but limit to reasonable bounds
        const newValue = Math.max(-ACTION_BUTTON_WIDTH, Math.min(0, lastOffset.current + gestureState.dx));
        translateX.setValue(newValue - lastOffset.current);
        
        // Calculate opacity based on how much the button is visible
        const visibleAmount = Math.abs(newValue);
        const opacity = Math.min(1, visibleAmount / ACTION_BUTTON_WIDTH);
        actionButtonOpacity.setValue(opacity);
        
        setIsSwiped(newValue < -10);
      },
      onPanResponderRelease: (_, gestureState) => {
        isSwipeActive.current = false;
        const currentValue = lastOffset.current + gestureState.dx;
        const velocity = gestureState.vx;
        translateX.flattenOffset();
        
        // Determine if we should open or close based on position and velocity
        const isCurrentlyOpen = lastOffset.current < -ACTION_BUTTON_WIDTH / 2;
        const shouldOpen = currentValue < -ACTION_BUTTON_WIDTH / 2 || (velocity < -0.5 && currentValue < -20);
        const shouldClose = currentValue > -ACTION_BUTTON_WIDTH / 2 || (velocity > 0.5 && isCurrentlyOpen);
        
        if (shouldOpen && !shouldClose) {
          // Open the button
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
          ]).start(() => {
            setIsSwiped(true);
          });
        } else {
          // Close the button
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
          ]).start(() => {
            setIsSwiped(false);
          });
        }
      },
      onPanResponderTerminate: () => {
        isSwipeActive.current = false;
        translateX.flattenOffset();
        lastOffset.current = 0;
        setIsSwiped(false);
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
    setIsSwiped(false);
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

  const handleCardPress = () => {
    if (lastOffset.current < 0) {
      isSwipeActive.current = false;
      lastOffset.current = 0;
      setIsSwiped(false);
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
    } else {
      bookCardProps.onPress();
    }
  };

  React.useEffect(() => {
    if (bookCardProps.selectionMode && lastOffset.current !== 0) {
      isSwipeActive.current = false;
      lastOffset.current = 0;
      setIsSwiped(false);
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
        <BookCard 
          {...bookCardProps} 
          dragHandleProps={undefined} 
          isSwiped={isSwiped}
          onPress={handleCardPress}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.actionButton,
          {
            opacity: actionButtonOpacity,
            backgroundColor: '#1a1a1a',
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
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    height: '100%',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

