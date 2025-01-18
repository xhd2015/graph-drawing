import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
    },
    server: {
        open: '/d3_graph.html'
    }
}); 