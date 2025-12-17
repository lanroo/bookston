import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: any;
}

export const PremiumBadge = React.memo(function PremiumBadge({
  size = 'medium',
  showText = false,
  style,
}: PremiumBadgeProps) {
  const sizeConfig = {
    small: { icon: 12, container: 20, text: 10 },
    medium: { icon: 16, container: 24, text: 12 },
    large: { icon: 20, container: 28, text: 14 },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  if (!config) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#E91E63', '#9C27B0', '#673AB7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: config.container || 24,
            height: config.container || 24,
            borderRadius: (config.container || 24) / 2,
          },
        ]}>
        <Ionicons name="diamond" size={config.icon || 16} color="#FFFFFF" />
      </LinearGradient>
      {showText && (
        <ThemedText style={[styles.badgeText, { fontSize: config.text }]}>
          Premium
        </ThemedText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E91E63',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontWeight: '700',
    color: '#E91E63',
    letterSpacing: 0.5,
  },
});
