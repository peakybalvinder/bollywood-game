import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },

  build: {
    // Improve chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          socket: ['socket.io-client'],
        },
      },
    },
    // Generate source maps for error tracking
    sourcemap: false,
    // Minify for production
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2020',
  },

  // Ensure assets are served correctly from the root
  base: '/',
});
