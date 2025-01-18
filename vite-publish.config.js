import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'publish',
        lib: {
            entry: 'src/index.ts',
            name: 'GraphDrawing',
            fileName: 'index',
        },
    },
    server: {
        open: '/index.html'
    },
    define: {
        'process.env': {
            'NODE_ENV': 'production'
        }
    }
});