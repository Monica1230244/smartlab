import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/smartlab/',
  plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
  build: {
    outDir: 'build',
    assetsDir: 'static'
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: []
  }
});
