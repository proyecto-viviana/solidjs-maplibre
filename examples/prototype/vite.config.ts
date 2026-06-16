import path from 'node:path';
import {defineConfig} from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  root: __dirname,
  plugins: [solid()],
  resolve: {
    alias: {
      'solidjs-maplibre': path.resolve(__dirname, '../../src/index.tsx')
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5174
  },
  build: {
    outDir: '../../dist-prototype',
    emptyOutDir: true
  }
});
