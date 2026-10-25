import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorTheme = 'amber' | 'violet' | 'ocean' | 'emerald' | 'rose';
type ThemeContextValue = { mode: ThemeMode; setMode: (mode: ThemeMode) => void; colorTheme: ColorTheme; setColorTheme: (theme: ColorTheme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const MODE_KEY = 'nexus:theme-mode';
const COLOR_KEY = 'nexus:color-theme';
const colors: Record<ColorTheme, string> = { amber: '38.36 89.06% 56.86%', violet: '258 82% 68%', ocean: '198 68% 52%', emerald: '158 58% 43%', rose: '345 78% 65%' };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => { const saved = localStorage.getItem(MODE_KEY); return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'; });
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => { const saved = localStorage.getItem(COLOR_KEY); return saved && saved in colors ? saved as ColorTheme : 'amber'; });
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
      root.dataset.theme = resolved;
      root.dataset.colorTheme = colorTheme;
      root.classList.toggle('dark', resolved === 'dark');
      root.classList.toggle('light', resolved === 'light');
      root.style.colorScheme = resolved;
      root.style.setProperty('--primary-ink', colors[colorTheme]);
      root.style.setProperty('--ring', colors[colorTheme]);
    };
    apply(); media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [mode, colorTheme]);
  const value = useMemo(() => ({ mode, setMode: (next: ThemeMode) => { localStorage.setItem(MODE_KEY, next); setModeState(next); }, colorTheme, setColorTheme: (next: ColorTheme) => { localStorage.setItem(COLOR_KEY, next); setColorThemeState(next); } }), [mode, colorTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error('useTheme must be used inside ThemeProvider'); return context; }
