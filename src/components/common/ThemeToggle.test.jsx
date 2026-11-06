import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import ThemeToggle from './ThemeToggle.jsx';
import { applyTheme, useThemeStore } from '@/store/useThemeStore';

beforeEach(() => {
  localStorage.clear();
  useThemeStore.setState({ theme: 'light' });
  applyTheme('light');
});

describe('ThemeToggle', () => {
  it('activa el modo oscuro y lo recuerda', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('padi-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('vuelve al modo claro', async () => {
    const user = userEvent.setup();
    useThemeStore.setState({ theme: 'dark' });
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: 'Activar modo claro' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('padi-theme')).toBe('light');
  });
});
