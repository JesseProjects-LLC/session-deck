import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    proxy: {
      // Use 127.0.0.1 (not localhost) — Node >=17 resolves localhost to IPv6 ::1,
      // but the backend listens on IPv4 only, causing 502s on every proxied call.
      '/api': {
        target: 'http://127.0.0.1:7890',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:7890',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
