import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { TabOption } from './types';

interface TabButtonProps<T extends string> {
  tab: TabOption<T>;
  isActive: boolean;
  onPress: () => void;
}

export function TabButton<T extends string>({ tab, isActive, onPress }: TabButtonProps<T>) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = '#0a7ea4';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const activeBorderColor = isActive ? tintColor + '40' : borderColor;

  return (
    <TouchableOpacity
      style={[
        styles.tab,
        {
          backgroundColor: isActive ? (isDark ? tintColor + '15' : tintColor + '10') : backgroundColor,
          borderColor: activeBorderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.6}>
      <View style={styles.tabContent}>
        <Ionicons
          name={tab.icon}
          size={22}
          color={isActive ? tintColor : (isDark ? textColor + 'CC' : textColor + '99')}
          style={styles.icon}
        />
        <ThemedText
          style={[
            styles.tabLabel,
            {
              color: isActive ? tintColor : textColor,
              fontWeight: isActive ? '600' : '400',
            },
          ]}>
          {tab.label}
        </ThemedText>
        {tab.badge !== undefined && tab.badge > 0 && (
          <View style={[styles.badge, { backgroundColor: isActive ? tintColor + '20' : (isDark ? textColor + '15' : textColor + '10') }]}>
            <ThemedText
              style={[
                styles.badgeText,
                {
                  color: isActive ? tintColor : (isDark ? textColor + 'CC' : textColor + '99'),
                  fontWeight: isActive ? '600' : '500',
                },
              ]}>
              {tab.badge}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
    width: 24,
  },
  tabLabel: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

