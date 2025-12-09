

import { useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

const SWIPE_THRESHOLD = 80;
const ACTION_BUTTON_WIDTH = 80;

interface UseSwipeActionOptions {
  selectionMode: boolean;
  isReordering: boolean;
  onActionPress: () => void;
}

interface UseSwipeActionReturn {
  translateX: Animated.Value;
  actionButtonOpacity: Animated.Value;
  isSwiped: boolean;
  panHandlers: any;
  closeSwipe: () => void;
}

export function useSwipeAction({
  selectionMode,
  isReordering,
  onActionPress,
}: UseSwipeActionOptions): UseSwipeActionReturn {
  const translateX = useRef(new Animated.Value(0)).current;
  const actionButtonOpacity = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const isSwipeActive = useRef(false);
  const [isSwiped, setIsSwiped] = useState(false);

  const closeSwipe = () => {
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
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        if (lastOffset.current < 0) return true;
        return false;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (selectionMode || isReordering) return false;
        
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const hasEnoughMovement = Math.abs(gestureState.dx) > 10;
        
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
        
        const newValue = Math.max(-ACTION_BUTTON_WIDTH, Math.min(0, lastOffset.current + gestureState.dx));
        translateX.setValue(newValue - lastOffset.current);
        
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
        
        const isCurrentlyOpen = lastOffset.current < -SWIPE_THRESHOLD;
        const shouldOpen = currentValue < -SWIPE_THRESHOLD || (velocity < -0.5 && currentValue < -20);
        const shouldClose = currentValue > -SWIPE_THRESHOLD || (velocity > 0.5 && isCurrentlyOpen);
        
        if (shouldOpen && !shouldClose) {
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
        closeSwipe();
      },
    })
  ).current;

  const handleActionPress = () => {
    closeSwipe();
    onActionPress();
  };

  return {
    translateX,
    actionButtonOpacity,
    isSwiped,
    panHandlers: panResponder.panHandlers,
    closeSwipe,
  };
}

