import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function ActionButton({ icon, label, onPress, variant = 'primary', style }: ActionButtonProps) {
  const colorScheme = useColorScheme();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary
          ? { backgroundColor: tintColor }
          : { backgroundColor: backgroundColor, borderColor: tintColor, borderWidth: 1.5 },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Ionicons
        name={icon}
        size={20}
        color={isPrimary ? (colorScheme === 'dark' ? '#000' : '#fff') : tintColor}
      />
      <ThemedText
        style={[
          styles.buttonText,
          isPrimary
            ? { color: colorScheme === 'dark' ? '#000' : '#fff' }
            : { color: tintColor },
        ]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    alignSelf: 'center',
    minWidth: 160, 
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

