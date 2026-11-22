import {defineConfig} from 'vite';
export default defineConfig({
 build: {
  emptyOutDir: true,
  sourcemap: true,
  lib: {entry: 'src/index.tsx', name: 'GenericSearchBar', formats: ['es'], fileName: () => 'searchbar-element.js'},
  // Deliberately bundle React and the UI implementation for framework-neutral consumers.
  rollupOptions: {output: {inlineDynamicImports: true}}
 }
});
