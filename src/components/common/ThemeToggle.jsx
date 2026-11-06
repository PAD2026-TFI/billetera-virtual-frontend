import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

const variants = {
  surface: 'bg-white text-[#4C1DB8] shadow-[0_8px_20px_-12px_rgba(58,18,153,0.6)] hover:bg-[#F3F1F9] dark:bg-[#1E1735] dark:text-[#FFD54A] dark:shadow-none dark:hover:bg-[#281F45]',
  overlay: 'bg-white/15 text-white hover:bg-white/25',
};

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
      className={`m-0 grid size-11 shrink-0 place-items-center rounded-full border-0 p-0 transition-colors ${variants[variant]} ${className}`}
    >
      <Icon key={theme} className="size-5 motion-safe:animate-in motion-safe:spin-in-45 motion-safe:fade-in" aria-hidden="true" />
    </button>
  );
}
