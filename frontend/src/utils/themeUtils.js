// Theme utility functions
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Get theme from localStorage or default to light
export const getCurrentTheme = () => {
  return localStorage.getItem('theme') || THEMES.LIGHT;
};

// Set theme in localStorage and apply to document
export const setTheme = (theme) => {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
};

// Apply theme to document body
export const applyTheme = (theme) => {
  const body = document.body;
  
  // Remove existing theme classes
  body.classList.remove('theme-light', 'theme-dark');
  
  // Add new theme class
  body.classList.add(`theme-${theme}`);
  
  // Update CSS custom properties
  if (theme === THEMES.DARK) {
    body.style.setProperty('--bg-primary', '#1a1a1a');
    body.style.setProperty('--bg-secondary', '#2d2d2d');
    body.style.setProperty('--bg-tertiary', '#404040');
    body.style.setProperty('--text-primary', '#ffffff');
    body.style.setProperty('--text-secondary', '#b0b0b0');
    body.style.setProperty('--border-color', '#404040');
    body.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
    body.style.setProperty('--hover-bg', '#404040');
  } else {
    body.style.setProperty('--bg-primary', '#ffffff');
    body.style.setProperty('--bg-secondary', '#f8f9fa');
    body.style.setProperty('--bg-tertiary', '#e9ecef');
    body.style.setProperty('--text-primary', '#333333');
    body.style.setProperty('--text-secondary', '#666666');
    body.style.setProperty('--border-color', '#e1e5e9');
    body.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
    body.style.setProperty('--hover-bg', '#f8f9fa');
  }
};

// Toggle between light and dark themes
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  setTheme(newTheme);
  return newTheme;
};

// Initialize theme on app load
export const initializeTheme = () => {
  const theme = getCurrentTheme();
  applyTheme(theme);
}; 