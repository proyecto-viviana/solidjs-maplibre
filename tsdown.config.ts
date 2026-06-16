import {defineConfig} from 'tsdown';
import solid from 'unplugin-solid/rolldown';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2020',
  clean: true,
  dts: true,
  deps: {
    neverBundle: ['maplibre-gl', /^solid-js(\/.*)?$/]
  },
  outputOptions: {
    exports: 'named'
  },
  plugins: [solid()]
});
