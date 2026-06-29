'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ai_agent_theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  // Respect OS preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Theme hook — persists to localStorage, syncs with <html> class.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark'); // SSR-safe default

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
