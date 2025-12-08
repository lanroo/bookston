import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

interface TabSelectorProps<T extends string> {
  tabs: TabOption<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  style?: ViewStyle;
}

export function TabSelector<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  style,
}: TabSelectorProps<T>) {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={[styles.tabsContainer, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && { backgroundColor: tintColor },
                !isActive && {
                  backgroundColor: backgroundColor,
                  borderColor: colorScheme === 'dark' ? textColor + '20' : '#FFFFFF',
                },
              ]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}>
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? (colorScheme === 'dark' ? '#000' : '#fff') : textColor}
              />
              <ThemedText
                style={[
                  styles.tabLabel,
                  isActive && { color: colorScheme === 'dark' ? '#000' : '#fff', fontWeight: '600' },
                ]}>
                {tab.label}
              </ThemedText>
              {tab.badge !== undefined && tab.badge > 0 && (
                <ThemedView
                  style={[
                    styles.tabBadge,
                    isActive
                      ? { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }
                      : { backgroundColor: textColor + '10' },
                  ]}>
                  <ThemedText
                    style={[
                      styles.tabBadgeText,
                      isActive && { color: colorScheme === 'dark' ? '#fff' : '#000' },
                    ]}>
                    {tab.badge}
                  </ThemedText>
                </ThemedView>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

