import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    // three (528KB) es lazy via dynamic import y no bloquea LCP: limite acorde
    chunkSizeWarningLimit: 600,
    reportCompressedSize: false,
    optimizeDeps: {
      include: ['three', 'gsap', 'lenis'],
    },
  },
});