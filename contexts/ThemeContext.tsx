import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    setTheme(themeMode);
  }, [themeMode]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeModeState(savedTheme as ThemeMode);
        setTheme(savedTheme as 'light' | 'dark');
      } else {
        const defaultTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
        setThemeModeState(defaultTheme);
        setTheme(defaultTheme);
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
      const defaultTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      setThemeModeState(defaultTheme);
      setTheme(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
      setTheme(mode);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

