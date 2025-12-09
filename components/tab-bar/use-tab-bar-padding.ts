/**
 * useTabBarPadding Hook
 * 
 * Provides padding bottom value to prevent content from being hidden behind tab bar
 * Single Responsibility: Calculates safe padding for tab bar
 */

import { Platform } from 'react-native';

const TAB_BAR_HEIGHT_IOS = 88; // Total height including safe area padding
const TAB_BAR_HEIGHT_ANDROID = 64;
const EXTRA_PADDING = 32; // Extra padding for comfortable spacing

export function useTabBarPadding() {
  const tabBarHeight = Platform.OS === 'ios' ? TAB_BAR_HEIGHT_IOS : TAB_BAR_HEIGHT_ANDROID;
  return tabBarHeight + EXTRA_PADDING;
}

