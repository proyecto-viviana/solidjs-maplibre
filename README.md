# solidjs-maplibre

SolidJS components for MapLibre GL JS.

This project is a Solid-native port of the `@vis.gl/react-maplibre` API. The
imperative MapLibre behavior is kept close to upstream while the component layer
uses Solid lifecycle, context, and JSX semantics.

## Install

```sh
pnpm add solidjs-maplibre maplibre-gl
```

`solid-js` and `maplibre-gl` are peer dependencies. Import the MapLibre CSS once
in your application entry:

```ts
import 'maplibre-gl/dist/maplibre-gl.css';
```

## Basic Usage

```tsx
import {Map, NavigationControl, ScaleControl} from 'solidjs-maplibre';

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
import {Map, type ViewState} from 'solidjs-maplibre';

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
import {Layer, Map, Source, type LayerSpecification} from 'solidjs-maplibre';

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

The library build uses `tsdown` with Solid's Rolldown plugin and emits ESM,
CommonJS, and declaration files into `dist`.

Release gate commands:

```sh
pnpm run typecheck
pnpm run typecheck:test
pnpm run test
pnpm run build
pnpm run typecheck:prototype
pnpm run build:prototype
pnpm pack --dry-run
```

See [docs/solid-port-plan.md](docs/solid-port-plan.md) for the porting plan,
[docs/implementation-roadmap.md](docs/implementation-roadmap.md) for completed
milestones, and [docs/parity-checklist.md](docs/parity-checklist.md) for the
upstream parity checklist. See [CHANGELOG.md](CHANGELOG.md) for release notes.
