import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { roundButtonClass, variants } from './buttonStyles';

export default function ThemeToggle({ variant = 'surface', className = '' }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={isDark}
      className={`${roundButtonClass} ${variants[variant]} ${className}`}
    >
      <Icon key={theme} className="size-5 motion-safe:animate-in motion-safe:spin-in-45 motion-safe:fade-in" aria-hidden="true" />
    </button>
  );
}
