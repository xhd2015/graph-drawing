import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
    },
    server: {
        open: '/index.html'
    },
});