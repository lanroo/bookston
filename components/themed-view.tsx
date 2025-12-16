import React from 'react';
import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = React.PropsWithChildren<ViewProps> & {
  lightColor?: string;
  darkColor?: string;
};

/**
 * ThemedView Component
 * 
 * A view component that automatically adapts to the current theme (light/dark).
 * Memoized to prevent unnecessary re-renders.
 * 
 * @param props - ThemedView component props extending ViewProps
 * @returns Memoized themed view component
 */
export const ThemedView = React.memo(function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
});
