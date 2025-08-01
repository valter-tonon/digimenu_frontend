'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProviderErrorBoundary } from '@/components/error-boundaries/ProviderErrorBoundary';
import { ThemeConfig, getTheme, applyTheme, getMagicUIProps, ThemeName } from '@/config/theme';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  themeConfig: ThemeConfig;
  magicUIProps: ReturnType<typeof getMagicUIProps>;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default fallback values
const DEFAULT_VALUES: ThemeContextType = {
  theme: 'auto',
  resolvedTheme: 'light',
  themeConfig: getTheme('light'),
  magicUIProps: getMagicUIProps(getTheme('light')),
  setTheme: () => {},
  toggleTheme: () => {},
  systemTheme: 'light'
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
  storageKey?: string;
}

function ThemeProviderInner({ 
  children, 
  initialTheme = 'auto',
  storageKey = 'digimenu-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme;
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    setMounted(true);
  }, [storageKey]);

  // Calculate resolved theme
  const resolvedTheme = theme === 'auto' ? systemTheme : theme;
  
  // Get theme configuration
  const themeConfig = getTheme(resolvedTheme as ThemeName);
  const magicUIProps = getMagicUIProps(themeConfig);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(resolvedTheme);
    
    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', resolvedTheme);
    
    // Set color-scheme for better browser integration
    root.style.colorScheme = resolvedTheme;

    // Apply comprehensive theme configuration
    applyTheme(themeConfig);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        themeConfig.colors.background
      );
    }
  }, [resolvedTheme, mounted, themeConfig]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }

    // Track theme change for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'theme_change', {
        event_category: 'ui',
        event_label: newTheme,
        value: 1
      });
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white">
        {children}
      </div>
    );
  }

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    themeConfig,
    magicUIProps,
    setTheme,
    toggleTheme,
    systemTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider(props: ThemeProviderProps) {
  return (
    <ProviderErrorBoundary
      fallback={
        <ThemeContext.Provider value={DEFAULT_VALUES}>
          {props.children}
        </ThemeContext.Provider>
      }
      onError={(error) => {
        console.error('ThemeProvider Error:', error);
      }}
    >
      <ThemeProviderInner {...props} />
    </ProviderErrorBoundary>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    console.warn('useTheme must be used within a ThemeProvider. Using default values.');
    return DEFAULT_VALUES;
  }
  
  return context;
}

// Hook for theme-aware styling
export function useThemeStyles() {
  const { resolvedTheme } = useTheme();
  
  return {
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    themeClass: resolvedTheme,
    // Common theme-aware styles
    bg: resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white',
    text: resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900',
    border: resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200',
    surface: resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
  };
}