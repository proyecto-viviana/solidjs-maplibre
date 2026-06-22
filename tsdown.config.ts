import {defineConfig, type UserConfig} from 'tsdown';
import solid from 'unplugin-solid/rolldown';

const sharedConfig = {
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2020',
  deps: {
    neverBundle: ['maplibre-gl', /^solid-js(\/.*)?$/]
  },
  outputOptions: {
    exports: 'named'
  }
} satisfies UserConfig;

export default defineConfig([{
  ...sharedConfig,
  entry: ['src/index.tsx'],
  clean: true,
  dts: true,
  plugins: [solid()]
}, {
  ...sharedConfig,
  entry: ['src/index.tsx'],
  format: ['esm'],
  clean: false,
  dts: false,
  inputOptions(options) {
    options.transform = {...(options.transform || {}), jsx: 'preserve'};
    return options;
  },
  outputOptions: {
    exports: 'named',
    entryFileNames: '[name].jsx',
    chunkFileNames: '_chunk/[name].jsx'
  }
}, {
  ...sharedConfig,
  entry: {
    server: 'src/index.tsx'
  },
  clean: false,
  dts: false,
  plugins: [solid({ssr: true})]
}]);
