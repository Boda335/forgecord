import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    watch: { ignored: ['**/*.zip', '**/*.rar'] },
    proxy: {
      '/api': {
        target: process.env.FORGECORD_API_PROXY || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.FORGECORD_API_PROXY || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: { '@': `${import.meta.dirname}/src` },
  },
});
