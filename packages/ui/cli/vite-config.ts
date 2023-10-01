import path from 'node:path';
import { defineConfig } from 'vite';
import worker from 'vite-plugin-wrap-worker';
import solidPlugin from 'vite-plugin-solid';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export const config = defineConfig({
  root: path.resolve('src'),
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [require('vite-plugin-wasm').default(), worker(), solidPlugin()],
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        tailwind({
          content: [path.resolve(__dirname, '../src/**/*.{js,ts,jsx,tsx}')],
          theme: {
            extend: {},
          },
          plugins: [require('@tailwindcss/container-queries')],
        }),
      ],
    },
    preprocessorOptions: {},
  },
});