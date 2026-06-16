import {vi} from 'vitest';
import type {MapContextValue} from '../../src/components/map';
import type {MapRef} from '../../src/maplibre/create-ref';

type Listener = (...args: any[]) => void;

export type FakeSource = Record<string, any> & {
  id: string;
  setData: ReturnType<typeof vi.fn>;
  updateImage: ReturnType<typeof vi.fn>;
  setCoordinates: ReturnType<typeof vi.fn>;
  setUrl: ReturnType<typeof vi.fn>;
  setTiles: ReturnType<typeof vi.fn>;
};

export type FakeLayer = Record<string, any> & {
  id: string;
};

export class FakeMapInstance {
  style = {_loaded: true};
  sources = new Map<string, FakeSource>();
  layers: FakeLayer[] = [];
  listeners = new Map<string, Set<Listener>>();

  addSource = vi.fn((id: string, spec: Record<string, any>) => {
    const source: FakeSource = {
      ...spec,
      id,
      setData: vi.fn((data: unknown) => {
        source.data = data;
      }),
      updateImage: vi.fn((image: unknown) => {
        source.image = image;
      }),
      setCoordinates: vi.fn((coordinates: unknown) => {
        source.coordinates = coordinates;
      }),
      setUrl: vi.fn((url: string) => {
        source.url = url;
      }),
      setTiles: vi.fn((tiles: string[]) => {
        source.tiles = tiles;
      })
    };
    this.sources.set(id, source);
  });

  getSource = vi.fn((id: string) => this.sources.get(id));

  removeSource = vi.fn((id: string) => {
    this.sources.delete(id);
  });

  addLayer = vi.fn((layer: FakeLayer, beforeId?: string) => {
    const nextLayer = {...layer};
    const beforeIndex = beforeId ? this.layers.findIndex(existing => existing.id === beforeId) : -1;
    if (beforeIndex >= 0) {
      this.layers.splice(beforeIndex, 0, nextLayer);
    } else {
      this.layers.push(nextLayer);
    }
  });

  getLayer = vi.fn((id: string) => this.layers.find(layer => layer.id === id));

  removeLayer = vi.fn((id: string) => {
    this.layers = this.layers.filter(layer => layer.id !== id);
  });

  moveLayer = vi.fn((id: string, beforeId?: string) => {
    const layer = this.getLayer(id);
    if (!layer) {
      return;
    }
    this.removeLayer(id);
    this.addLayer(layer, beforeId);
  });

  setLayoutProperty = vi.fn((id: string, key: string, value: unknown) => {
    const layer = this.getLayer(id);
    if (layer) {
      layer.layout = {...layer.layout, [key]: value};
    }
  });

  setPaintProperty = vi.fn((id: string, key: string, value: unknown) => {
    const layer = this.getLayer(id);
    if (layer) {
      layer.paint = {...layer.paint, [key]: value};
    }
  });

  setFilter = vi.fn((id: string, filter: unknown) => {
    const layer = this.getLayer(id);
    if (layer) {
      layer.filter = filter;
    }
  });

  setLayerZoomRange = vi.fn((id: string, minzoom?: number, maxzoom?: number) => {
    const layer = this.getLayer(id);
    if (layer) {
      layer.minzoom = minzoom;
      layer.maxzoom = maxzoom;
    }
  });

  getStyle = vi.fn(() => ({
    sources: Object.fromEntries(this.sources),
    layers: this.layers.map(layer => ({...layer}))
  }));

  on = vi.fn((eventName: string, listener: Listener) => {
    const listeners = this.listeners.get(eventName) || new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    return this;
  });

  off = vi.fn((eventName: string, listener: Listener) => {
    this.listeners.get(eventName)?.delete(listener);
    return this;
  });

  fire(eventName: string) {
    for (const listener of this.listeners.get(eventName) || []) {
      listener({type: eventName, target: this});
    }
  }
}

export function createFakeMapContext(map = new FakeMapInstance()) {
  const mapRef = {
    getMap: () => map
  } as unknown as MapRef;

  const context = {
    map: mapRef,
    mapLib: {}
  } as MapContextValue;

  return {map, mapRef, context};
}
