export interface TabColors {
  bg: string;
  text: string;
  icon: string;
  border: string;
}

export function getTabColor(tabId: string, isDark: boolean): TabColors {
  const primaryColor = isDark ? '#4A9BC4' : '#0a7ea4';
  const primaryBg = isDark ? '#1A2A33' : '#E6F4F8';
  const primaryBorder = isDark ? '#2A3A43' : '#B8D4E0';

  const colors: Record<string, TabColors> = {
    'all': {
      bg: isDark ? '#2C2C2E' : '#F2F2F7',
      text: isDark ? '#FFFFFF' : '#000000',
      icon: isDark ? '#FFFFFF' : '#000000',
      border: isDark ? '#3A3A3C' : '#E5E5EA',
    },
    'want-to-read': {
      bg: primaryBg,
      text: primaryColor,
      icon: primaryColor,
      border: primaryBorder,
    },
    'reading': {
      bg: primaryBg,
      text: primaryColor,
      icon: primaryColor,
      border: primaryBorder,
    },
    'read': {
      bg: primaryBg,
      text: primaryColor,
      icon: primaryColor,
      border: primaryBorder,
    },
    'rereading': {
      bg: primaryBg,
      text: primaryColor,
      icon: primaryColor,
      border: primaryBorder,
    },
  };

  return colors[tabId] || colors['all'];
}

