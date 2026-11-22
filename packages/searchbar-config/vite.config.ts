import {defineConfig} from 'vite';
export default defineConfig({
  build: {
    emptyOutDir: true,
    sourcemap: true,
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.js',  },
    rollupOptions: { external: ["@searchbarkit/core"] }
  }
});
