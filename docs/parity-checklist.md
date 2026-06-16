# Upstream Parity Checklist

Reference upstream surface: `visgl/react-map-gl` `modules/react-maplibre`.

## Export Surface

Status: implemented at the top level.

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
| Standard controls | Implemented, needs tests | Control add/remove and option updates. |
| `Marker` | Implemented, needs tests | Portal children, DOM style/class updates, popup attachment, drag/click events. |
| `Popup` | Implemented, needs tests | Portal children, open/close events, style/class updates, position updates. |
| `Source` | Implemented, needs tests | GeoJSON/image/vector update paths, cleanup, style reload recreation. |
| `Layer` | Implemented, needs tests | Source inheritance, paint/layout/filter updates, ordering, cleanup. |
| Controlled camera | Wrapper and Solid component behavior covered | Keep Playwright prototype smoke checks in the release gate. |
| Interactive events | Partial | `interactiveLayerIds`, queried features, hover enter/leave transitions. |
| Style components | Partial | `light`, `terrain`, `projection`, `sky`, and style reload behavior. |
| Map reuse | Pending | `reuseMaps`, recycled container children, restored props and initial camera. |
| Examples | Prototype only | Split into focused examples before release. |

## Test Targets

- Unit tests for framework-neutral utilities.
- jsdom component tests with fake MapLibre instances for Solid lifecycle,
  context, portals, and declarative style graph behavior.
- Direct wrapper tests for controlled camera initialization, prop-driven camera
  updates, resize behavior, internal update suppression, and camera event
  `viewState`.
- Solid component tests for reactive controlled `viewState` updates and
  `onMove` feedback loops.
- Browser smoke checks with Playwright CLI for the controlled prototype app.
- Future browser tests for feature picking once interactive layer surfaces are
  complete.
