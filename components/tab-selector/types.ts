import { Ionicons } from '@expo/vector-icons';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

