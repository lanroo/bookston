

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Platform } from 'react-native';

export function useTabBarStyles() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[colorScheme ?? 'light'];

  return {
    tabBarStyle: {
      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      height: Platform.OS === 'ios' ? 88 : 64,
      paddingBottom: Platform.OS === 'ios' ? 28 : 8,
      paddingTop: 8,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      position: 'absolute' as const,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600' as const,
      marginTop: 4,
    },
    tabBarIconStyle: {
      marginTop: 4,
    },
    tabBarActiveTintColor: themeColors.tint,
    tabBarInactiveTintColor: themeColors.tabIconDefault,
  };
}

