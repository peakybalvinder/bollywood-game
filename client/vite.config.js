import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png', 'og-image.png'],
      manifest: {
        name: 'FilmiPaheli — Bollywood Movie Guessing Game',
        short_name: 'FilmiPaheli',
        description: 'Free multiplayer Bollywood movie guessing game with friends.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0505',
        theme_color: '#FFD700',
        lang: 'en-IN',
        orientation: 'portrait-primary',
        categories: ['games', 'entertainment'],
        icons: [
          { src: '/favicon.png',         sizes: '32x32',   type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          { src: '/favicon.svg',          sizes: 'any',     type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache static assets aggressively, never cache API/socket
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
      },
    }),
  ],

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
