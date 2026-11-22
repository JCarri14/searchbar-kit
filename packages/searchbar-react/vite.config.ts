import {defineConfig} from 'vite';
export default defineConfig({
  build: {
    emptyOutDir: true,
    sourcemap: true,
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.js', cssFileName: 'styles',  },
    rollupOptions: { external: ["@searchbarkit/core", "react", "react-dom", "lucide-react", "motion", "motion/react", "react/jsx-runtime"] }
  }
});
