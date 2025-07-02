import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // ✅ fixes missing fonts/css on Render
  publicDir: 'public', // ✅ ensures all /public assets are included in build
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/fonts.googleapis.com': {
        target: 'https://fonts.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fonts.googleapis.com/, '')
      },
      '/m.media-amazon.com': {
        target: 'https://m.media-amazon.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/m.media-amazon.com/, '')
      }
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  },
  assetsInclude: ['**/*.onnx'],
  build: {
    chunkSizeWarningLimit: 8000,
  }
});
