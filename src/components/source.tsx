import {
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  JSX,
  onCleanup,
  splitProps,
  useContext
} from 'solid-js';
import {MapContext} from './use-map';
import assert from '../utils/assert';
import {deepEqual} from '../utils/deep-equal';

import type {
  AnySourceImplementation,
  GeoJSONSourceImplementation,
  ImageSourceImplementation
} from '../types/internal';
import type {SourceSpecification} from '../types/style-spec';
import type {MapInstance} from '../types/lib';

export type SourceProps = SourceSpecification & {
  id?: string;
  children?: JSX.Element;
};

type SourceOptionsProps = SourceSpecification & {
  id?: string;
};

type ResolvedSourceProps = SourceSpecification & {
  id: string;
};

export const SourceContext = createContext<string>();

let sourceCounter = 0;

function sourceOptions(props: SourceOptionsProps): SourceSpecification {
  const options = {...props} as Record<string, unknown>;
  delete options.id;
  return options as SourceSpecification;
}

function createSource(map: MapInstance, id: string, props: SourceOptionsProps) {
  if (map.style && map.style._loaded) {
    map.addSource(id, sourceOptions(props));
    return map.getSource(id);
  }
  return null;
}

function updateSource(source: AnySourceImplementation, props: ResolvedSourceProps, prevProps: ResolvedSourceProps) {
  assert(props.id === prevProps.id, 'source id changed');
  assert(props.type === prevProps.type, 'source type changed');

  let changedKey = '';
  let changedKeyCount = 0;
  const nextRecord = props as Record<string, unknown>;
  const prevRecord = prevProps as Record<string, unknown>;

  for (const key in nextRecord) {
    if (key !== 'id' && !deepEqual(prevRecord[key], nextRecord[key])) {
      changedKey = key;
      changedKeyCount++;
    }
  }

  if (!changedKeyCount) {
    return;
  }

  if (props.type === 'geojson') {
    (source as GeoJSONSourceImplementation).setData((props as Record<string, unknown>).data);
  } else if (props.type === 'image') {
    const imageProps = props as Record<string, unknown>;
    (source as ImageSourceImplementation).updateImage({
      url: imageProps.url as string,
      coordinates: imageProps.coordinates
    });
  } else {
    switch (changedKey) {
      case 'coordinates':
        source.setCoordinates?.(nextRecord.coordinates);
        break;
      case 'url':
        source.setUrl?.(nextRecord.url as string);
        break;
      case 'tiles':
        source.setTiles?.(nextRecord.tiles as string[]);
        break;
      default:
        console.warn(`Unable to update <Source> prop: ${changedKey}`);
    }
  }
}

export function Source(props: SourceProps) {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('<Source> must be used inside a <Map>');
  }

  const [localProps, sourceProps] = splitProps(props, ['children']);
  const map = context.map.getMap();
  const id = createMemo(() => sourceProps.id || `solid-source-${sourceCounter++}`)();
  const [styleLoadedVersion, setStyleLoadedVersion] = createSignal(0);
  const [sourceReady, setSourceReady] = createSignal(false);
  let previousProps: ResolvedSourceProps = {...sourceProps, id} as ResolvedSourceProps;

  createEffect(() => {
    styleLoadedVersion();
    const nextProps = {...sourceProps, id} as ResolvedSourceProps;
    let source = map.style ? map.getSource(id) : undefined;

    if (source) {
      updateSource(source as AnySourceImplementation, nextProps, previousProps);
    } else {
      source = createSource(map, id, nextProps) || undefined;
    }

    previousProps = nextProps;
    setSourceReady(Boolean(source));
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
    if (map.style && map.style._loaded && map.getSource(id)) {
      const allLayers = map.getStyle()?.layers;
      if (allLayers) {
        for (const layer of allLayers) {
          if ('source' in layer && layer.source === id && map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        }
      }
      map.removeSource(id);
    }
  });

  return (
    <Show when={sourceReady() ? id : undefined}>
      {sourceId => <SourceContext.Provider value={sourceId()}>{localProps.children}</SourceContext.Provider>}
    </Show>
  );
}
