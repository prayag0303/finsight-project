import { createContext } from 'react';

// Light mode only — dark mode removed per design spec
export const ThemeContext = createContext({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }) {
  // Ensure html element never has .dark class
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
  }
  return (
    <ThemeContext.Provider value={{ isDark: false, toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}
