/**
 * Vite Build Configuration for Chat Widget
 *
 * Purpose: Build embeddable widget as IIFE bundle
 * Target: <50KB gzipped for optimal performance
 * Output: public/widget/chat-widget.js
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    // Output to parent project's public directory
    outDir: '../public/widget',
    emptyOutDir: true,

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChatWidget',
      formats: ['iife'],
      fileName: () => 'chat-widget.js'
    },

    // Optimization for small bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      },
      mangle: {
        toplevel: true
      }
    },

    // Target modern browsers for smaller bundle
    target: 'es2020',

    // Inline everything (no external dependencies)
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },

    // Source maps for debugging (remove for production)
    sourcemap: false,

    // Report bundle size
    reportCompressedSize: true,
    chunkSizeWarningLimit: 50 // 50KB warning
  }
});
