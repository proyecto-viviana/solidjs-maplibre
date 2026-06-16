# Upstream Parity Checklist

Reference upstream surface: `visgl/react-map-gl` `modules/react-maplibre`.

## Export Surface

Status: implemented at the top level. A compile-only public type export test
covers the upstream-compatible common, event, library, and style-spec aliases.
`ViewState.padding` remains optional because this Solid port can emit camera
state before padding is configured.

- `Map`
- default `Map`
- `Marker`
- `Popup`
- `AttributionControl`
- `FullscreenControl`
- `GeolocateControl`
- `NavigationControl`
- `ScaleControl`
- `TerrainControl`
- `LogoControl`
- `Source`
- `Layer`
- `useControl`
- `MapProvider`
- `useMap`
- Component prop types
- Map, event, library, and style-spec types

## Behavioral Parity

| Area | Status | Next Checks |
| --- | --- | --- |
| Package build | Implemented | Keep `tsdown` output free of React transforms and bundled peers. |
| `Map` mount/unmount | Implemented, needs tests | Map ref creation, context publication, cleanup, error handling. |
| `MapProvider` and `useMap` | Implemented, needs tests | Named maps, `current`, duplicate id guard, unmount cleanup. |
| Standard controls | Implemented; geolocate event callbacks covered | Control add/remove and option updates for remaining controls. |
| `Marker` | Implemented, needs tests | Portal children, DOM style/class updates, popup attachment, drag/click events. |
| `Popup` | Implemented, needs tests | Portal children, open/close events, style/class updates, position updates. |
| `Source` | GeoJSON update, cleanup order, and style reload recreation covered | Add image/vector update coverage. |
| `Layer` | Source inheritance, paint updates, cleanup order, and style reload recreation covered | Add layout/filter/ordering coverage. |
| Controlled camera | Wrapper and Solid component behavior covered | Keep Playwright prototype smoke checks in the release gate. |
| Interactive events | Wrapper behavior covered | Keep Playwright picking smoke checks in the release gate. |
| Style components | Map style, light, terrain, projection, and sky update tests covered; focused terrain/globe prototype mode added | Keep visual smoke checks in the release gate. |
| Map reuse | Wrapper and Solid `reuseMaps` behavior covered | Add release example coverage if reuse remains public in examples. |
| Examples | Focused prototype modes added | Promote selected modes into standalone docs examples before release if needed. |

## Test Targets

- Unit tests for framework-neutral utilities.
- jsdom component tests with fake MapLibre instances for Solid lifecycle,
  context, portals, and declarative style graph behavior.
- Direct wrapper tests for controlled camera initialization, prop-driven camera
  updates, resize behavior, internal update suppression, and camera event
  `viewState`.
- Solid component tests for reactive controlled `viewState` updates and
  `onMove` feedback loops.
- Direct wrapper tests for `interactiveLayerIds` filtering, feature-enriched
  pointer events, and hover enter/leave transitions.
- Component tests for `Source`/`Layer` cleanup order and style reload
  recreation.
- Direct wrapper tests for `mapStyle`, `light`, `terrain`, `projection`, and
  `sky` updates.
- Direct wrapper tests for `reuseMaps`, recycled container children, restored
  props, restored initial camera, and initial bounds.
- Solid component tests for remounting with `reuseMaps`.
- Solid component tests for `GeolocateControl` event callback props.
- Browser smoke checks with Playwright CLI for the controlled prototype app.
- Browser smoke checks with Playwright CLI for feature picking in the prototype
  app.
- Browser smoke checks with Playwright CLI for terrain and globe projection in
  the prototype app.
- Browser smoke checks with Playwright CLI for the basic, controls,
  marker/popup, GeoJSON, controlled, picking, terrain, and full demo prototype
  modes.
