

import type { GestureResponderHandlers } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon: string;
  badge?: number;
}

export type DragHandleProps = Partial<GestureResponderHandlers>;

export interface TouchEvent {
  nativeEvent: {
    pageX: number;
    pageY: number;
    locationX: number;
    locationY: number;
  };
}

