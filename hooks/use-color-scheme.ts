import { ThemeContext } from '@/contexts/ThemeContext';
import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';


export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useRNColorScheme();
  const context = useContext(ThemeContext);
  
  if (context) {
    return context.theme;
  }
  
  return systemColorScheme === 'dark' ? 'dark' : 'light';
}
