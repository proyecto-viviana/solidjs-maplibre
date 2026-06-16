# Implementation Roadmap

This roadmap turns the port plan into commit-sized work. Each phase should end
with tests, a package build, a prototype check when UI behavior changed, and a
commit.

## Commit Cadence

- Commit the initial working slice before expanding scope.
- Keep docs/test scaffolding separate from behavioral changes when practical.
- Commit each compatibility area independently: controlled camera, interactive
  events, style reloads, reuse maps, and examples.
- Keep generated build output, Playwright scratch files, and local screenshots
  out of source control.

## Phase 1: Baseline Hardening

Goal: make the current port slice testable and prevent regressions while the API
surface expands.

- Add Vitest configuration for Solid JSX and jsdom.
- Add fake MapLibre test doubles for source/layer and component lifecycle tests.
- Test `MapProvider`, `useMap`, and `createRef`.
- Test nested `Source`/`Layer` composition, update, and cleanup.
- Test `Marker` and `Popup` portal rendering and cleanup.
- Test control mount/unmount through `useControl`.
- Keep the prototype as the browser smoke test.

## Phase 2: Controlled Camera

Goal: match the practical controlled/uncontrolled camera behavior users expect
from `@vis.gl/react-maplibre`.

- [x] Audit `initialViewState`, individual camera props, and `viewState`.
- [x] Verify `onMoveStart`, `onMove`, `onMoveEnd`, and related zoom/rotate/pitch
  events include `viewState`.
- [x] Add tests for prop-driven camera updates.
- [x] Add tests for internal camera updates not re-entering controlled updates.
- [x] Add Solid component-level tests for reactive controlled `viewState`.
- [x] Add a controlled-map example to the prototype set.
- [x] Exercise the controlled prototype with Playwright CLI before moving to
  Phase 3.

## Phase 3: Interactive Layer Events

Goal: support feature-enriched pointer events for data-driven applications.

- [x] Verify `interactiveLayerIds` filtering.
- [x] Test `features` on click, move, enter, and leave.
- [x] Verify hover state transitions when moving into and out of queried features.
- [x] Add a picking example that displays selected feature attributes.
- [x] Exercise the picking prototype with Playwright CLI before moving to
  Phase 4.

## Phase 4: Style Reload Resilience

Goal: keep declarative sources, layers, and style components stable across
MapLibre style changes.

- [x] Test `Source` and `Layer` recreation after `styledata`.
- [x] Verify cleanup order when nested layers and sources unmount.
- [ ] Test `light`, `terrain`, `projection`, `sky`, and `mapStyle` updates.
- [ ] Add terrain/globe examples.

## Phase 5: Map Reuse And Release Polish

Goal: finish the compatibility edges before publishing.

- Verify `reuseMaps` behavior and cleanup.
- Expand type parity against upstream.
- Add examples for basic map, controls, marker/popup, GeoJSON, controlled map,
  picking, and terrain.
- Run package checks, prototype checks, and publish dry-run checks.
