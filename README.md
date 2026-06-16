# solidjs-maplibre

SolidJS components for MapLibre GL JS.

This project is a Solid-native port of the `@vis.gl/react-maplibre` API. The
imperative MapLibre behavior is kept close to upstream while the component layer
uses Solid lifecycle, context, and JSX semantics.

See [docs/solid-port-plan.md](docs/solid-port-plan.md) for the porting plan,
[docs/implementation-roadmap.md](docs/implementation-roadmap.md) for the next
work phases, and [docs/parity-checklist.md](docs/parity-checklist.md) for the
upstream parity checklist.

## Current Status

The first port slice is in progress:

- `Map`
- `MapProvider`
- `useMap`
- `useControl`
- Standard MapLibre controls
- Core MapLibre wrapper and `MapRef`
- `Marker`
- `Popup`
- `Source`
- `Layer`
- Prototype app in `examples/prototype`

The library build uses `tsdown` with Solid's Rolldown plugin and emits ESM,
CommonJS, and declaration files into `dist`.
