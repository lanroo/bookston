

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

interface ReorderButtonProps {
  opacity: Animated.Value;
  onPress: () => void;
}

const ACTION_BUTTON_WIDTH = 80;

export function ReorderButton({ opacity, onPress }: ReorderButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const buttonBackgroundColor = isDark ? '#1f1f1f' : '#e0e0e0';
  const buttonTextColor = isDark ? '#fff' : '#333333';
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: buttonBackgroundColor,
        },
      ]}>
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.8}>
        <Ionicons name="reorder-three" size={28} color={buttonTextColor} />
        <Animated.Text style={[styles.text, { color: buttonTextColor }]}>Reorganizar</Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    height: '100%',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

