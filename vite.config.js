const { defineConfig } = require('vite');
const { resolve } = require('path');

module.exports = defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'widget/src/index.ts'),
            name: 'ChatWidget',
            fileName: (format) => `chat-widget.${format}.js`,
            formats: ['iife'],
        },
        outDir: 'public/widget',
        emptyOutDir: true,
    },
});
