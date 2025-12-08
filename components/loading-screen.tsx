import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = 'Carregando...', fullScreen = true }: LoadingScreenProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const containerStyle = fullScreen
    ? [styles.container, { backgroundColor }]
    : [styles.inlineContainer, { backgroundColor }];

  return (
    <ThemedView style={containerStyle}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={tintColor} />
        {message && (
          <ThemedText style={[styles.message, { color: textColor }]}>
            {message}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
    marginTop: 8,
  },
});

