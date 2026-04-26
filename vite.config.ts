import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    proxy: isTauri ? {} : {
      '/api': 'http://localhost:3000'
    }
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    outDir: 'dist/frontend',
    target: isTauri ? ['es2021', 'chrome105', 'safari15'] : 'modules',
    minify: !process.env.TAURI_DEBUG,
    sourcemap: !!process.env.TAURI_DEBUG
  }
});