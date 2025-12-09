/**
 * TabConfig
 * 
 * Configuration for tab navigation screens
 * Single Responsibility: Defines tab screen configurations
 */

import React from 'react';
import { TabIconProps } from './tab-icons';
import { TabIcons } from './tab-icons';

export interface TabScreenConfig {
  name: string;
  title: string;
  icon: (props: TabIconProps) => React.ReactElement;
}

export const TAB_SCREENS: TabScreenConfig[] = [
  {
    name: 'index',
    title: 'Home',
    icon: TabIcons.Home,
  },
  {
    name: 'books',
    title: 'Books',
    icon: TabIcons.Books,
  },
  {
    name: 'notes',
    title: 'Notes',
    icon: TabIcons.Notes,
  },
  {
    name: 'settings',
    title: 'Settings',
    icon: TabIcons.Settings,
  },
];

