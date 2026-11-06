import { create } from 'zustand';

const storageKey = 'padi-theme';

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    return 'light';
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export const useThemeStore = create(set => ({
  theme: readInitialTheme(),
  toggleTheme: () =>
    set(state => {
      const theme = state.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        return { theme };
      }
      return { theme };
    }),
}));

useThemeStore.subscribe(state => applyTheme(state.theme));
