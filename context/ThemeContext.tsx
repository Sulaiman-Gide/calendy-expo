import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    secondary: string;
    tint: string;
    tabIconDefault: string;
    tabIconSelected: string;
  };
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('system');
  
  // Get the actual theme to use (system or user preference)
  const effectiveTheme = theme === 'system' ? systemColorScheme || 'light' : theme;
  
  // Theme colors
  const colors = {
    light: {
      background: '#ffffff',
      card: '#ffffff',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      primary: '#3b82f6',
      secondary: '#6b7280',
      tint: '#0a7ea4',
      tabIconDefault: '#687076',
      tabIconSelected: '#0a7ea4',
    },
    dark: {
      background: '#121212',
      card: '#1e1e1e',
      text: '#f5f5f5',
      textSecondary: '#9ca3af',
      border: '#333333',
      primary: '#60a5fa',
      secondary: '#9ca3af',
      tint: '#fff',
      tabIconDefault: '#9BA1A6',
      tabIconSelected: '#fff',
    },
  };

  // Save theme preference to AsyncStorage
  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setTheme(savedTheme as Theme);
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    
    loadThemePreference();
  }, []);

  // Update theme preference in AsyncStorage when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem('@theme', theme);
      } catch (error) {
        console.error('Failed to save theme preference', error);
      }
    };
    
    saveThemePreference();
  }, [theme]);

  return (
    <ThemeContext.Provider 
      value={{
        theme,
        setTheme,
        colors: colors[effectiveTheme === 'dark' ? 'dark' : 'light']
      }}
    >
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
