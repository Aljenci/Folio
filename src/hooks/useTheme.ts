// src/hooks/useTheme.ts
import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import type { Theme } from '../stores/settingsStore';

/** Resolved theme — excludes 'auto' since it maps to light or dark at runtime. */
type ResolvedTheme = 'light' | 'dark' | 'sepia';

export type { Theme };

/**
 * Applies the active theme to the document root via the data-theme attribute.
 * When theme is 'auto', follows the OS prefers-color-scheme and updates live
 * whenever the OS setting changes.
 */
export function useTheme() {
  const { theme, setTheme } = useSettingsStore();

  useEffect(() => {
    function applyTheme(resolved: ResolvedTheme) {
      document.documentElement.setAttribute('data-theme', resolved);
    }

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  /** The theme as actually rendered (resolves 'auto' to light or dark). */
  function resolvedTheme(): ResolvedTheme {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  return { theme, setTheme, resolvedTheme };
}
