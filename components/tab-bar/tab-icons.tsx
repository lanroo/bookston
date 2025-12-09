/**
 * TabIcons Component
 * 
 * Provides icon components for tab navigation
 * Single Responsibility: Renders tab bar icons
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export interface TabIconProps {
  color: string;
  size?: number;
}

export const TabIcons = {
  Home: ({ color, size = 24 }: TabIconProps) => (
    <Ionicons name="home" size={size} color={color} />
  ),
  Books: ({ color, size = 24 }: TabIconProps) => (
    <Ionicons name="library" size={size} color={color} />
  ),
  Notes: ({ color, size = 24 }: TabIconProps) => (
    <Ionicons name="document-text" size={size} color={color} />
  ),
  Settings: ({ color, size = 24 }: TabIconProps) => (
    <Ionicons name="settings" size={size} color={color} />
  ),
};

