import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: { '/socket.io': { target: 'http://localhost:3001', ws: true } },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: { vendor: ['react', 'react-dom'], socket: ['socket.io-client'] },
      },
    },
    minify: 'esbuild',
    target: 'es2020',
  },

  base: '/',
});
