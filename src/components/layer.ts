import {createEffect, createMemo, createSignal, onCleanup, useContext} from 'solid-js';
import {MapContext} from './use-map';
import {SourceContext} from './source';
import assert from '../utils/assert';
import {deepEqual} from '../utils/deep-equal';

import type {CustomLayerInterface, MapInstance} from '../types/lib';
import type {LayerSpecification} from '../types/style-spec';

type OptionalId<T> = T extends {id: string} ? Omit<T, 'id'> & {id?: string} : T;
type OptionalSource<T> = T extends {source: string} ? Omit<T, 'source'> & {source?: string} : T;

export type LayerProps = (OptionalSource<OptionalId<LayerSpecification>> | CustomLayerInterface) & {
  beforeId?: string;
};

function layerRecord(props: LayerProps): Record<string, any> {
  return props as Record<string, any>;
}

function updateLayer(map: MapInstance, id: string, props: LayerProps, prevProps: LayerProps) {
  assert(props.id === prevProps.id, 'layer id changed');
  assert(props.type === prevProps.type, 'layer type changed');

  if (props.type === 'custom' || prevProps.type === 'custom') {
    return;
  }

  const next = layerRecord(props);
  const prev = layerRecord(prevProps);
  const {layout = {}, paint = {}, filter, minzoom, maxzoom, beforeId} = next;

  if (beforeId !== prev.beforeId) {
    map.moveLayer(id, beforeId);
  }
  if (layout !== prev.layout) {
    const prevLayout = prev.layout || {};
    for (const key in layout) {
      if (!deepEqual(layout[key], prevLayout[key])) {
        map.setLayoutProperty(id, key, layout[key]);
      }
    }
    for (const key in prevLayout) {
      if (!Object.prototype.hasOwnProperty.call(layout, key)) {
        map.setLayoutProperty(id, key, undefined);
      }
    }
  }
  if (paint !== prev.paint) {
    const prevPaint = prev.paint || {};
    for (const key in paint) {
      if (!deepEqual(paint[key], prevPaint[key])) {
        map.setPaintProperty(id, key, paint[key]);
      }
    }
    for (const key in prevPaint) {
      if (!Object.prototype.hasOwnProperty.call(paint, key)) {
        map.setPaintProperty(id, key, undefined);
      }
    }
  }

  if (!deepEqual(filter, prev.filter)) {
    map.setFilter(id, filter);
  }
  if (minzoom !== prev.minzoom || maxzoom !== prev.maxzoom) {
    map.setLayerZoomRange(id, minzoom, maxzoom);
  }
}

function createLayer(map: MapInstance, id: string, props: LayerProps) {
  const record = layerRecord(props);
  const source = record.source as string | undefined;
  const layerType = record.type as string | undefined;
  const layerNeedsSource = layerType !== 'background' && layerType !== 'custom' && layerType !== 'sky';

  if (!map.style || !map.style._loaded) {
    return null;
  }

  if (layerNeedsSource && (!source || !map.getSource(source))) {
    return null;
  }

  const options: LayerProps = {...props, id};
  delete options.beforeId;
  map.addLayer(options as LayerSpecification, record.beforeId);
  return map.getLayer(id);
}

let layerCounter = 0;

export function Layer(props: LayerProps) {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('<Layer> must be used inside a <Map>');
  }

  const sourceId = useContext(SourceContext);
  const map = context.map.getMap();
  const id = createMemo(() => props.id || `solid-layer-${layerCounter++}`)();
  const [styleLoadedVersion, setStyleLoadedVersion] = createSignal(0);
  const initialRecord = layerRecord(props);
  let previousProps: LayerProps = {...props, id, ...(initialRecord.source == null && sourceId ? {source: sourceId} : {})};

  const resolvedProps = (): LayerProps => {
    const record = layerRecord(props);
    return {
      ...props,
      id,
      ...(record.source == null && sourceId ? {source: sourceId} : {})
    } as LayerProps;
  };

  createEffect(() => {
    styleLoadedVersion();
    const nextProps = resolvedProps();
    const layer = map.style && map.getLayer(id);

    if (layer) {
      try {
        updateLayer(map, id, nextProps, previousProps);
      } catch (error) {
        console.warn(error);
      }
    } else {
      createLayer(map, id, nextProps);
    }

    previousProps = nextProps;
  });

  let styleReloadTimer: ReturnType<typeof setTimeout> | undefined;
  const forceUpdate = () => {
    clearTimeout(styleReloadTimer);
    styleReloadTimer = setTimeout(() => setStyleLoadedVersion(version => version + 1), 0);
  };
  map.on('styledata', forceUpdate);
  forceUpdate();

  onCleanup(() => {
    clearTimeout(styleReloadTimer);
    map.off('styledata', forceUpdate);
    if (map.style && map.style._loaded && map.getLayer(id)) {
      map.removeLayer(id);
    }
  });

  return null;
}
