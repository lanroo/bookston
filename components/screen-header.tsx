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

export function ScreenHeader({
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
      {rightAction || (onAddPress && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: tintColor }]}
          onPress={onAddPress}
          activeOpacity={0.8}>
          <Ionicons name={addButtonIcon} size={24} color={colorScheme === 'dark' ? '#000' : '#fff'} />
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

