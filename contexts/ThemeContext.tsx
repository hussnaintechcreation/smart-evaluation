import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { ThemeName } from '../types';

interface ThemeConfig {
  name: ThemeName;
  primaryBgClass: string; 
  textColorClass: string; 
  cardBgClass: string; 
  borderColorClass: string; 
  gradientFromHex: string; 
  gradientToHex: string; 
  qrCodeFgColor: string;
  primaryBgColorHex: string; // For 3D canvas background
  isDark: boolean; 
  // FIX: Add textColorHex to be used for inline styles where a hex value is needed.
  textColorHex: string;
}

const themes: Record<ThemeName, ThemeConfig> = {
  'dark-blue': {
    name: 'dark-blue',
    primaryBgClass: 'bg-[#0a0a0a]',
    textColorClass: 'text-gray-200',
    cardBgClass: 'bg-white/80 dark:bg-gray-900/80',
    borderColorClass: 'border-cyan-500/30',
    gradientFromHex: '#00F0FF',
    gradientToHex: '#0066FF',
    qrCodeFgColor: '#e5e7eb', // gray-200
    primaryBgColorHex: '#0a0a0a',
    isDark: true,
    textColorHex: '#e5e7eb',
  },
  'light-slate': {
    name: 'light-slate',
    primaryBgClass: 'bg-slate-100',
    textColorClass: 'text-slate-800',
    cardBgClass: 'bg-white/90',
    borderColorClass: 'border-slate-300',
    gradientFromHex: '#1a73e8', // Google Blue
    gradientToHex: '#4285f4', // Google Blue Lighter
    qrCodeFgColor: '#1f2937', // gray-800
    primaryBgColorHex: '#f1f5f9', // slate-100
    isDark: false,
    textColorHex: '#1e293b',
  },
  'cyber-purple': {
    name: 'cyber-purple',
    primaryBgClass: 'bg-[#1a0033]',
    textColorClass: 'text-purple-100',
    cardBgClass: 'bg-purple-900/70 backdrop-blur-md',
    borderColorClass: 'border-purple-500/30',
    gradientFromHex: '#ff00ff', // Magenta
    gradientToHex: '#8a2be2', // Blue Violet
    qrCodeFgColor: '#ede9fe', // purple-100
    primaryBgColorHex: '#1a0033',
    isDark: true,
    textColorHex: '#ede9fe',
  }
};

interface ThemeContextType {
  themeName: ThemeName;
  theme: ThemeConfig;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('htc-theme') as ThemeName;
    return savedTheme && themes[savedTheme] ? savedTheme : 'dark-blue';
  });

  useEffect(() => {
    localStorage.setItem('htc-theme', themeName);
    
    const root = document.documentElement;

    // Remove old background and text classes from root
    Object.values(themes).forEach(t => {
      // Only remove if it's an actual Tailwind class (starts with bg- or text-)
      if (t.primaryBgClass.startsWith('bg-')) root.classList.remove(t.primaryBgClass);
      if (t.textColorClass.startsWith('text-')) root.classList.remove(t.textColorClass);
    });

    // Add new background and text classes
    root.classList.add(themes[themeName].primaryBgClass, themes[themeName].textColorClass);

    // Update dark/light class for components that still rely on it
    if (themes[themeName].isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update CSS variables for gradients
    root.style.setProperty('--gradient-from', themes[themeName].gradientFromHex);
    root.style.setProperty('--gradient-to', themes[themeName].gradientToHex);

  }, [themeName]);

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider value={{ themeName, theme, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
