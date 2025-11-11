/**
 * Vite Build Configuration for Chat Widget
 *
 * Purpose: Bundles widget into IIFE format for embedding
 * Responsibility: Build, minify, and optimize widget JavaScript
 *
 * Constraints:
 * - Must output IIFE format (single script tag deployment)
 * - Target bundle size: <50KB gzipped
 * - No external dependencies (everything bundled)
 * - ES5 compatible for older browsers
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    // Output to public/widget directory (served by Next.js)
    outDir: '../public/widget',
    emptyOutDir: true,

    // Library mode - build as IIFE
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChatWidget',
      formats: ['iife'],
      fileName: 'chat-widget',
    },

    // Optimization settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },

    // No code splitting - single file output
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },

    // Source maps for debugging
    sourcemap: true,

    // Target older browsers
    target: 'es2015',
  },

  // Type checking
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
