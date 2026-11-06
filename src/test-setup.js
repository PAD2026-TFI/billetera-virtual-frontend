import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useAuthStore } from './store/useAuthStore.js';

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
    window.HTMLElement.prototype.setPointerCapture = () => {};
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  useAuthStore.getState().logout();
  window.history.replaceState({}, '', '/');
});
