import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { TabButton } from './tab-button';
import type { TabOption } from './types';

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
  const textColor = useThemeColor({}, 'text');
  const isDark = colorScheme === 'dark';

  return (
    <ThemedView style={[styles.tabsContainer, { borderBottomColor: isDark ? textColor + '15' : 'rgba(0,0,0,0.08)' }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}>
        {tabs.map((tab, index) => (
          <View key={tab.id} style={index > 0 && styles.tabSpacing}>
            <TabButton
              tab={tab}
              isActive={activeTab === tab.id}
              onPress={() => onTabChange(tab.id)}
            />
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  tabSpacing: {
    marginLeft: 10,
  },
});

