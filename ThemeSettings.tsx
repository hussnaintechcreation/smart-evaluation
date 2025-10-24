import React, { useState, useEffect } from 'react';
import './ThemeSettings.css';

const themes = [
    {
        // REFACTOR: Renamed to clarify this is the default *dark* theme preset.
        name: 'Smart Interview (Dark)',
        id: 'default-dark',
        colors: {
            '--primary-bg': '#0D1117',
            '--secondary-bg': '#161B22',
            '--card-bg': '#1E242C',
            '--primary-accent': '#A78BFA', // Higher contrast purple
            '--secondary-accent': '#8B949E',
            '--text-primary': '#F0F6FC',
            '--text-secondary': '#C9D1D9',
            '--border-color': '#30363D',
        }
    },
    {
        // REFACTOR: Renamed to clarify this is now the application's default theme.
        name: 'Smart Interview (Light)',
        id: 'default-light',
        colors: {
            '--primary-bg': '#F7F9FC',
            '--secondary-bg': '#FFFFFF',
            '--card-bg': '#FFFFFF',
            '--primary-accent': '#007BFF',
            '--secondary-accent': '#6C757D',
            '--text-primary': '#212529',
            '--text-secondary': '#6C757D',
            '--border-color': '#DEE2E6',
        }
    },
    {
        name: 'Cyberpunk Glow',
        id: 'cyberpunk',
        colors: {
            '--primary-bg': '#0A0A1E',
            '--secondary-bg': '#141432',
            '--card-bg': '#1F1F47',
            '--primary-accent': '#FF00FF',
            '--secondary-accent': '#00FFFF',
            '--text-primary': '#EAEAEA',
            '--text-secondary': '#7DF9FF',
            '--border-color': '#4A2A69',
        }
    },
    {
        name: 'Solaris Light',
        id: 'solaris',
        colors: {
            '--primary-bg': '#FFFBF5',
            '--secondary-bg': '#FFFFFF',
            '--card-bg': '#FFFFFF',
            '--primary-accent': '#FF7B00',
            '--secondary-accent': '#6A8EAE',
            '--text-primary': '#2C3E50',
            '--text-secondary': '#8492A6',
            '--border-color': '#EAEAEA',
        }
    }
];

// REFACTOR: Use the dark theme from the presets array for the toggle.
const darkTheme = themes.find(t => t.id === 'default-dark')!.colors;


export const ThemeSettings = ({ setTheme, defaultTheme }) => {
  // FIX: Default to light mode (isDarkMode = false) to match the new app default.
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState('default-light');
  const [customColors, setCustomColors] = useState({
    primary: defaultTheme['--primary-accent'],
    secondary: defaultTheme['--secondary-accent'],
  });

  const handleThemeSelect = (theme) => {
    setTheme(theme.colors);
    setActiveThemeId(theme.id);
    // Sync the toggle switch based on whether the selected theme is light or dark.
    const isLightTheme = ['default-light', 'solaris'].includes(theme.id);
    setIsDarkMode(!isLightTheme);
    // Sync custom color pickers to the selected theme's accents
    setCustomColors({
        primary: theme.colors['--primary-accent'],
        secondary: theme.colors['--secondary-accent'],
    });
  };

  const handleModeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    // FIX: Correctly toggle between the default light theme and the default dark theme.
    const newTheme = newMode ? darkTheme : defaultTheme;
    setTheme(newTheme);
    setActiveThemeId(newMode ? 'default-dark' : 'default-light');
    // Sync custom color pickers
    setCustomColors({
        primary: newTheme['--primary-accent'],
        secondary: newTheme['--secondary-accent'],
    });
  };

  const handleCustomColorChange = (colorName: 'primary' | 'secondary', value: string) => {
    const newCustomColors = { ...customColors, [colorName]: value };
    setCustomColors(newCustomColors);

    const baseTheme = isDarkMode ? darkTheme : defaultTheme;

    const newTheme = {
        ...baseTheme, // Use background/text colors from the current mode
        '--primary-accent': newCustomColors.primary,
        '--secondary-accent': newCustomColors.secondary,
    };
    
    setTheme(newTheme);
    setActiveThemeId('custom');
  };

  const handleKeyDown = (event, theme) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleThemeSelect(theme);
    }
  };

  return (
    <div className="theme-settings-panel">
       <div className="animated-background"></div>
       <header className="page-header">
        <h2>Color Theme Customizer</h2>
        <p>Select a theme or use the toggle for a quick light/dark mode switch.</p>
      </header>

      <div className="theme-toggle-container">
        <span>Light Mode</span>
        <label className="theme-toggle-switch">
          <input 
            type="checkbox" 
            checked={isDarkMode}
            onChange={handleModeToggle}
            aria-label="Toggle between light and dark mode"
          />
          <span className="slider"></span>
        </label>
        <span>Dark Mode</span>
      </div>
      
      <section className={`custom-theme-section ${activeThemeId === 'custom' ? 'active' : ''}`}>
        <h3 id="custom-theme-heading">Customize Accent Colors</h3>
        <div className="color-pickers-container" aria-labelledby="custom-theme-heading">
          <div className="color-picker">
            <label htmlFor="primary-color">Primary Accent</label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                id="primary-color" 
                value={customColors.primary} 
                onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                aria-label="Primary accent color picker"
              />
              <span>{customColors.primary.toUpperCase()}</span>
            </div>
          </div>
          <div className="color-picker">
            <label htmlFor="secondary-color">Secondary Accent</label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                id="secondary-color" 
                value={customColors.secondary} 
                onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                aria-label="Secondary accent color picker"
              />
              <span>{customColors.secondary.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="theme-grid" role="radiogroup" aria-labelledby="theme-grid-label">
        <h3 id="theme-grid-label" className="sr-only">Select a Color Theme</h3>
        {themes.map(theme => (
          <div 
            key={theme.id}
            className="theme-card"
            onClick={() => handleThemeSelect(theme)}
            onKeyDown={(e) => handleKeyDown(e, theme)}
            tabIndex={0}
            role="radio"
            aria-checked={activeThemeId === theme.id}
            aria-label={theme.name}
          >
            <h3>{theme.name}</h3>
            <div className="color-palette">
              <div className="palette-color" style={{ backgroundColor: theme.colors['--primary-accent'] }}></div>
              <div className="palette-color" style={{ backgroundColor: theme.colors['--secondary-accent'] }}></div>
              <div className="palette-color" style={{ backgroundColor: theme.colors['--text-primary'] }}></div>
              <div className="palette-color" style={{ backgroundColor: theme.colors['--secondary-bg'] }}></div>
              <div className="palette-color" style={{ backgroundColor: theme.colors['--primary-bg'] }}></div>
            </div>
          </div>
        ))}
      </div>
       {/* FIX: This button now correctly resets to the default light theme. */}
       <button onClick={() => {
            handleThemeSelect(themes.find(t => t.id === 'default-light'));
        }} className="reset-theme-button">
        Reset to Default
      </button>
    </div>
  );
};