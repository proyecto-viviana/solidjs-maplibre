# SolidJS MapLibre Port Plan

This package is a SolidJS port of the MapLibre implementation from
`visgl/react-map-gl`, specifically the `modules/react-maplibre` package.

The goal is not to wrap the React package. The goal is to keep the proven
MapLibre behavior from upstream while replacing React lifecycle, context,
refs, portals, and child cloning with Solid-native primitives.

## Principles

- Keep the imperative MapLibre wrapper close to upstream so behavior stays
  familiar and easier to compare.
- Use Solid primitives directly: `onMount`, `onCleanup`, `createSignal`,
  `createEffect`, `createMemo`, `createContext`, and `useContext`.
- Preserve the JSX component surface where it makes sense:
  `Map`, controls, `Marker`, `Popup`, `Source`, `Layer`, `MapProvider`,
  `useMap`, and `useControl`.
- Prefer Solid-native APIs where React concepts do not translate cleanly.
  In particular, callback refs and context are preferred over React-style
  `forwardRef` and child cloning.
- Keep `maplibre-gl` as a peer dependency.

## Upstream Surface

The React package currently exports:

- `Map`
- `Marker`
- `Popup`
- `AttributionControl`
- `FullscreenControl`
- `GeolocateControl`
- `NavigationControl`
- `ScaleControl`
- `TerrainControl`
- `GlobeControl`
- `LogoControl`
- `Source`
- `Layer`
- `useControl`
- `MapProvider`
- `useMap`
- Map, event, and style types

## Milestones

### 0.1 Foundation

- Scaffold a TypeScript library package.
- Build the package with `tsdown` and `unplugin-solid/rolldown` so compiled JS
  and declarations come from the same Rolldown-based pipeline.
- Port framework-neutral utilities and types.
- Port the imperative MapLibre wrapper.
- Implement Solid `Map`, `MapProvider`, `useMap`, and `useControl`.
- Implement the standard controls.
- Verify that a basic map can mount, update props, dispatch events, and clean
  up on unmount.

### 0.2 Overlay Components

- Port `Marker` using Solid portals.
- Port `Popup` using Solid portals.
- Support callback refs for marker and popup instances.
- Verify children render into MapLibre-managed DOM nodes.

### 0.3 Style Graph Components

- Port `Source`.
- Port `Layer`.
- Replace React child cloning with a Solid-compatible source context so nested
  layers can inherit the source id.
- Preserve source/layer cleanup order.
- Verify behavior across `styledata` reloads.

### 0.4 Compatibility Depth

- Expand controlled view-state coverage.
- Verify `reuseMaps`.
- Add tests for interactive layer events and queried features.
- Add tests for terrain, projection, sky, and light updates.

### 1.0 Release Criteria

- Match the practical upstream API surface.
- Include examples for basic map, controlled map, controls, markers/popups,
  GeoJSON source/layer, and terrain.
- Publish generated type declarations.
- Document Solid-specific differences from `@vis.gl/react-maplibre`.

## First Implementation Slice

The first slice in this repository creates the package skeleton and ports the
foundation plus the first style/rendering components:

- `Maplibre` imperative wrapper
- `MapRef`
- `Map`
- `MapProvider`
- `useMap`
- `useControl`
- Standard MapLibre controls
- `Marker`
- `Popup`
- `Source`
- `Layer`
- Prototype example app under `examples/prototype`

The current prototype has focused modes for basic map mounting, controls,
marker/popup overlays, GeoJSON `Source`/`Layer` composition, controlled
`viewState`, feature picking through `interactiveLayerIds`, globe projection,
terrain updates through a local raster-dem source, and the full integrated
operations flow.
The remaining porting work is release polish: publish dry-run checks and
release-focused documentation.

See [implementation-roadmap.md](implementation-roadmap.md) for the work order
and [parity-checklist.md](parity-checklist.md) for the upstream compatibility
audit.
