import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { BookStatus } from '@/types';

interface BookStatusButtonsProps {
  currentStatus: BookStatus;
  onStatusChange: (status: BookStatus) => void;
  onClose?: () => void;
}

interface StatusOption {
  id: BookStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const STATUS_CONFIG: Record<BookStatus, StatusOption> = {
  'want-to-read': {
    id: 'want-to-read',
    label: 'Quero Ler',
    icon: 'bookmark-outline',
  },
  'reading': {
    id: 'reading',
    label: 'Lendo',
    icon: 'book-outline',
  },
  'read': {
    id: 'read',
    label: 'Já Li',
    icon: 'checkmark-circle-outline',
  },
  'rereading': {
    id: 'rereading',
    label: 'Relendo',
    icon: 'refresh-outline',
  },
};

export function BookStatusButtons({ currentStatus, onStatusChange, onClose }: BookStatusButtonsProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const separatorColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const tintColor = '#0a7ea4';

  const allStatuses = Object.values(STATUS_CONFIG);

  const handleStatusPress = (status: BookStatus) => {
    onStatusChange(status);
    if (onClose) {
      onClose();
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {allStatuses.map((status, index) => {
        const isSelected = currentStatus === status.id;
        const isLast = index === allStatuses.length - 1;

        return (
          <View key={status.id}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleStatusPress(status.id)}
              activeOpacity={0.6}>
              <View style={styles.optionContent}>
                <Ionicons
                  name={status.icon}
                  size={22}
                  color={isSelected ? tintColor : (isDark ? textColor + 'CC' : textColor + '99')}
                  style={styles.icon}
                />
                <ThemedText
                  style={[
                    styles.optionLabel,
                    {
                      color: isSelected ? tintColor : textColor,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}>
                  {status.label}
                </ThemedText>
              </View>
              {isSelected && (
                <Ionicons name="checkmark" size={20} color={tintColor} />
              )}
            </TouchableOpacity>
            {!isLast && (
              <View style={[styles.separator, { backgroundColor: separatorColor }]} />
            )}
          </View>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
    width: 24,
  },
  optionLabel: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
});

