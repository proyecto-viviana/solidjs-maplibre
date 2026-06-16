import type {MapInstance} from '../types/lib';
import type Maplibre from './maplibre';

const skipMethods = [
  'setMaxBounds',
  'setMinZoom',
  'setMaxZoom',
  'setMinPitch',
  'setMaxPitch',
  'setRenderWorldCopies',
  'setProjection',
  'setStyle',
  'addSource',
  'removeSource',
  'addLayer',
  'removeLayer',
  'setLayerZoomRange',
  'setFilter',
  'setPaintProperty',
  'setLayoutProperty',
  'setLight',
  'setTerrain',
  'setFog',
  'remove'
] as const;

export type MapRef = {
  getMap(): MapInstance;
} & Omit<MapInstance, (typeof skipMethods)[number]>;

export default function createRef(mapInstance: Maplibre | null): MapRef | null {
  if (!mapInstance) {
    return null;
  }

  const map = mapInstance.map;
  const result: Record<string, unknown> = {
    getMap: () => map
  };

  for (const key of getMethodNames(map)) {
    if (!(key in result) && !(skipMethods as readonly string[]).includes(key)) {
      result[key] = map[key].bind(map);
    }
  }

  return result as MapRef;
}

function getMethodNames(obj: Record<string, any>) {
  const result = new Set<string>();
  let proto = obj;

  while (proto) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (
        key[0] !== '_' &&
        typeof obj[key] === 'function' &&
        key !== 'fire' &&
        key !== 'setEventedParent'
      ) {
        result.add(key);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }

  return Array.from(result);
}
