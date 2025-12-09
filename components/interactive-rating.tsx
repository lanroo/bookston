import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, GestureResponderEvent, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

interface InteractiveRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  saving?: boolean;
  size?: number;
}

/**
 * InteractiveRating Component
 * 
 * An interactive star rating component with touch gestures.
 * Allows users to rate by tapping or dragging across stars.
 * 
 * @param props - InteractiveRating component props
 * @returns Interactive rating component
 */
export const InteractiveRating = React.memo(function InteractiveRating({
  rating,
  onRatingChange,
  saving = false,
  size = 28,
}: InteractiveRatingProps) {
  const textColor = useThemeColor({}, 'text');
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isRatingActive, setIsRatingActive] = useState(false);
  const [ratingContainerWidth, setRatingContainerWidth] = useState(0);
  const ratingScale = useRef(new Animated.Value(1)).current;
  const containerRef = useRef<View>(null);
  const containerXRef = useRef<number>(0);

  const handleRatingGesture = (x: number) => {
    if (ratingContainerWidth === 0) return;

    const starSize = size;
    const gap = 4;
    const totalWidth = 5 * starSize + 4 * gap;

    const startX = Math.max(0, (ratingContainerWidth - totalWidth) / 2);
    const relativeX = x - startX;

    if (relativeX < 0) {
      setHoveredRating(1);
      return;
    }

    if (relativeX >= totalWidth) {
      setHoveredRating(5);
      return;
    }

    const starWidth = starSize + gap;
    let newRating = Math.floor(relativeX / starWidth) + 1;

    const positionInStar = relativeX % starWidth;
    if (positionInStar > starSize / 2 && newRating < 5) {
      newRating = newRating + 1;
    }

    newRating = Math.max(1, Math.min(5, newRating));
    setHoveredRating(newRating);
  };

  const handleTouchStart = (evt: GestureResponderEvent) => {
    if (saving) return;

    setIsRatingActive(true);
    Animated.spring(ratingScale, {
      toValue: 1.1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    if (containerRef.current) {
      containerRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
        containerXRef.current = px;
        const x = evt.nativeEvent.pageX;
        const relativeX = x - px;
        handleRatingGesture(relativeX);
      });
    }
  };

  const handleTouchMove = (evt: GestureResponderEvent) => {
    if (!isRatingActive || saving) return;
    const x = evt.nativeEvent.pageX;
    const relativeX = x - containerXRef.current;
    handleRatingGesture(relativeX);
  };

  const handleTouchEnd = () => {
    if (saving) return;

    setIsRatingActive(false);
    Animated.spring(ratingScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    const finalRating = hoveredRating > 0 ? hoveredRating : rating || 0;
    if (finalRating > 0 && finalRating !== rating) {
      onRatingChange(finalRating);
    }
    setHoveredRating(0);
  };

  const displayRating = isRatingActive && hoveredRating > 0 ? hoveredRating : rating || 0;

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0) {
          setRatingContainerWidth(width);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}>
      <Animated.View
        style={[
          styles.starsWrapper,
          {
            transform: [{ scale: ratingScale }],
          },
        ]}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isActive = isRatingActive && star === displayRating && hoveredRating > 0;

          return (
            <TouchableOpacity
              key={star}
              onPress={() => {
                if (!saving) {
                  onRatingChange(star);
                }
              }}
              activeOpacity={0.7}
              style={styles.starWrapper}
              disabled={saving}>
              <Ionicons
                name={isFilled ? 'star' : 'star-outline'}
                size={size}
                color={isFilled ? '#FFD700' : textColor + '40'}
              />
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsWrapper: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  starWrapper: {
  },
});

