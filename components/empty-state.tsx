import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ActionButton } from '@/components/action-button';
import { useThemeColor } from '@/hooks/use-theme-color';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  style,
}: EmptyStateProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView
      style={[
        styles.emptyState,
        { backgroundColor: backgroundColor, borderColor: textColor + '10' },
        style,
      ]}>
      <Ionicons name={icon} size={64} color={textColor} style={{ opacity: 0.3 }} />
      <ThemedText type="subtitle" style={[styles.emptyStateTitle, { opacity: 0.7 }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.emptyStateText, { opacity: 0.5 }]}>{description}</ThemedText>
      {primaryAction && (
        <ActionButton
          icon={primaryAction.icon}
          label={primaryAction.label}
          variant="primary"
          onPress={primaryAction.onPress}
          style={styles.actionButton}
        />
      )}
      {secondaryAction && (
        <ActionButton
          icon={secondaryAction.icon}
          label={secondaryAction.label}
          variant="secondary"
          onPress={secondaryAction.onPress}
          style={styles.actionButton}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 12,
  },
});

