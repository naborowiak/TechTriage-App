import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95 border bg-white dark:bg-midnight-800 border-light-300 dark:border-midnight-600 text-text-primary dark:text-white"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 group-hover:text-electric-indigo transition-colors" />
      ) : (
        <Sun className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
      )}
    </button>
  );
};
