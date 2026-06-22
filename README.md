# @proyecto-viviana/solidjs-maplibre

SolidJS components for MapLibre GL JS.

This project is a Solid-native port of the `@vis.gl/react-maplibre` API. The
imperative MapLibre behavior is kept close to upstream while the component layer
uses Solid lifecycle, context, and JSX semantics.

## Install

```sh
pnpm add @proyecto-viviana/solidjs-maplibre maplibre-gl
```

`solid-js` and `maplibre-gl` are peer dependencies. Import the MapLibre CSS once
in your application entry:

```ts
import 'maplibre-gl/dist/maplibre-gl.css';
```

## Basic Usage

```tsx
import {Map, NavigationControl, ScaleControl} from '@proyecto-viviana/solidjs-maplibre';

export function App() {
  return (
    <Map
      initialViewState={{
        longitude: -56.1645,
        latitude: -34.9011,
        zoom: 11
      }}
      mapStyle="https://demotiles.maplibre.org/style.json"
      style={{width: '100vw', height: '100vh'}}
    >
      <NavigationControl position="top-right" />
      <ScaleControl position="bottom-left" />
    </Map>
  );
}
```

## Controlled Camera

```tsx
import {createSignal} from 'solid-js';
import {Map, type ViewState} from '@proyecto-viviana/solidjs-maplibre';

export function ControlledMap() {
  const [viewState, setViewState] = createSignal<ViewState>({
    longitude: -56.1645,
    latitude: -34.9011,
    zoom: 11,
    pitch: 0,
    bearing: 0
  });

  return (
    <Map
      viewState={viewState()}
      onMove={event => setViewState(event.viewState)}
      mapStyle="https://demotiles.maplibre.org/style.json"
      style={{width: '100%', height: '100%'}}
    />
  );
}
```

## Declarative Data

```tsx
import {
  Layer,
  Map,
  Source,
  type LayerSpecification
} from '@proyecto-viviana/solidjs-maplibre';

const routeLayer: LayerSpecification = {
  id: 'route-line',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#1d4ed8',
    'line-width': 4
  }
};

export function RouteMap() {
  return (
    <Map
      mapStyle="https://demotiles.maplibre.org/style.json"
      style={{width: '100%', height: '100%'}}
    >
      <Source
        id="route"
        type="geojson"
        data={{
          type: 'FeatureCollection',
          features: []
        }}
      >
        <Layer {...routeLayer} />
      </Source>
    </Map>
  );
}
```

## Component Surface

- `Map`
- `MapProvider`
- `useMap`
- `useControl`
- `AttributionControl`
- `FullscreenControl`
- `GeolocateControl`
- `NavigationControl`
- `ScaleControl`
- `TerrainControl`
- `GlobeControl`
- `LogoControl`
- Core MapLibre wrapper and `MapRef`
- `Marker`
- `Popup`
- `Source`
- `Layer`
- Prototype app in `examples/prototype`

The package exports upstream-compatible MapLibre common, event, library, and
style-spec types from the top-level entry.

## Solid-Specific Differences

- Use `class` and `classList` props instead of React `className`.
- Use callback refs, for example `ref={map => ...}`, to receive `MapRef`,
  marker, popup, and control instances.
- `Source` provides nested source context to child `Layer` components instead
  of cloning JSX children.
- `ViewState.padding` is optional because the map can emit camera state before
  padding is configured.
- Event prop names follow the upstream React package, including controlled
  camera events and feature-enriched pointer events.

## Examples

The browser smoke app lives in [examples/prototype](examples/prototype). It
contains focused modes for:

- Basic map
- Controls
- Marker and popup overlays
- GeoJSON `Source`/`Layer`
- Controlled camera
- Feature picking with `interactiveLayerIds`
- Terrain and globe controls
- Full integrated demo

Run it locally with:

```sh
pnpm run dev:prototype
```

## Development

The library build uses `tsdown` and emits three package entries into `dist`:
JSX-preserved ESM for the `solid` export condition, DOM-compiled ESM/CommonJS
fallbacks, and explicit server ESM/CommonJS output for Node consumers.

Release gate commands:

```sh
pnpm run typecheck
pnpm run typecheck:test
pnpm run test
pnpm run build
pnpm run test:ssr
pnpm run typecheck:prototype
pnpm run build:prototype
pnpm pack --dry-run
```

`pnpm run ci:release-readiness` runs the same gate used before publishing.

Release workflow commands:

```sh
pnpm run changeset
pnpm run release:prepare
pnpm run release:publish
```

The `release` workflow opens Changesets version PRs on `main` and publishes
`@proyecto-viviana/solidjs-maplibre` through npm trusted publishing after the
version PR lands. The publishing path is intentionally split:

- `version-pr` can write the Changesets version PR, but has no npm OIDC token.
- `build-package` builds and uploads the package tarball, but has no npm OIDC token.
- `publish` runs in the `npm` environment with `id-token: write`, but does not
  checkout the repository, install dependencies, restore caches, or run package
  scripts. It only downloads the tarball from the same workflow run and calls
  `npm publish --provenance`.
- `github-release` creates release metadata after npm publishing, but has no npm
  OIDC token and does not checkout or install dependencies.

Configure npm trusted publishing from the npm package settings:

- Publisher: GitHub Actions
- Organization or user: `proyecto-viviana`
- Repository: `solidjs-maplibre`
- Workflow filename: `release.yml`
- Environment name: `npm`
- Allowed actions: `npm publish`

Create a GitHub environment named `npm` for the publish job. Restrict it to
`main` deployments and add required reviewers if you want a manual release gate.
No `NPM_TOKEN` secret is needed for trusted publishing. For the first package
bootstrap, publish `@proyecto-viviana/solidjs-maplibre` as public with npm org
permissions, or use npm's new-package trusted publisher flow if it is available
to the org:

```sh
pnpm run ci:release-readiness
npm publish --access public
```

See [docs/solid-port-plan.md](docs/solid-port-plan.md) for the porting plan,
[docs/implementation-roadmap.md](docs/implementation-roadmap.md) for completed
milestones, and [docs/parity-checklist.md](docs/parity-checklist.md) for the
upstream parity checklist. See [docs/release-security.md](docs/release-security.md)
for the release hardening model and [CHANGELOG.md](CHANGELOG.md) for release
notes.
