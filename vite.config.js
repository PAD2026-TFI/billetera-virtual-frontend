import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Los tests formatean fechas: fijamos la zona horaria para que den igual en cualquier máquina y en CI.
process.env.TZ ??= 'America/Argentina/Buenos_Aires';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: { port: 5173, strictPort: true },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.js'] },
});