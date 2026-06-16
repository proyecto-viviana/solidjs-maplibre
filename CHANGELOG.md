# Changelog

## 0.1.0

Initial SolidJS MapLibre port release.

### Added

- Solid-native `Map`, `MapProvider`, `useMap`, and `useControl`.
- MapLibre controls: attribution, fullscreen, geolocate, navigation, scale,
  terrain, globe, and logo.
- Overlay components: `Marker` and `Popup` with Solid portals and callback refs.
- Declarative style graph components: `Source` and `Layer`.
- Controlled camera support with `viewState`, `initialViewState`, and camera
  event callbacks that include `viewState`.
- Feature-enriched pointer events through `interactiveLayerIds`.
- Style reload resilience for declarative sources, layers, light, terrain,
  projection, sky, and map style updates.
- `reuseMaps` support for remounting maps.
- Upstream-compatible public type exports for common MapLibre types, events,
  library aliases, and style-spec types.
- Focused Vite prototype modes for basic maps, controls, marker/popup,
  GeoJSON, controlled camera, feature picking, terrain/globe, and the full demo.

### Notes

- This package is a Solid-native port of `@vis.gl/react-maplibre`, not a wrapper
  around the React package.
- Solid-specific differences are documented in `README.md`.
- The package builds with `tsdown` and keeps `solid-js` and `maplibre-gl` as
  peer dependencies.

### Validation

- `pnpm run typecheck`
- `pnpm run typecheck:test`
- `pnpm run test`
- `pnpm run build`
- `pnpm run typecheck:prototype`
- `pnpm run build:prototype`
- `pnpm pack --dry-run`
