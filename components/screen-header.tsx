import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ScreenHeaderProps {
  title: string;
  onAddPress?: () => void;
  addButtonIcon?: keyof typeof Ionicons.glyphMap;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * ScreenHeader Component
 * 
 * Displays a screen header with title and optional action button.
 * Memoized to prevent unnecessary re-renders.
 * 
 * @param props - ScreenHeader component props
 * @returns Memoized screen header component
 */
export const ScreenHeader = React.memo(function ScreenHeader({
  title,
  onAddPress,
  addButtonIcon = 'add',
  rightAction,
  style,
}: ScreenHeaderProps) {
  const colorScheme = useColorScheme();
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={[styles.header, style]}>
      <ThemedText type="title" style={styles.headerTitle}>
        {title}
      </ThemedText>
      <ThemedView style={styles.actionsContainer}>
        {onAddPress && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tintColor }]}
            onPress={onAddPress}
            activeOpacity={0.8}>
            <Ionicons name={addButtonIcon} size={24} color={colorScheme === 'dark' ? '#000' : '#fff'} />
          </TouchableOpacity>
        )}
        {rightAction && (
          <ThemedView style={styles.rightActionContainer}>
            {rightAction}
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionContainer: {
    marginLeft: 0,
  },
});

