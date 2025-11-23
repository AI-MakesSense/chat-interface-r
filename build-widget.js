const { build } = require('vite');
const { resolve } = require('path');

(async () => {
    try {
        await build({
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
            configFile: false, // Disable config file loading
        });
        console.log('Widget build completed successfully!');
    } catch (error) {
        console.error('Widget build failed:', error);
        process.exit(1);
    }
})();
