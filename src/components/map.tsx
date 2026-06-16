import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  JSX,
  onCleanup,
  onMount,
  splitProps,
  useContext
} from 'solid-js';
import {MountedMapsContext, MapContext, type CurrentMapContextValue} from './use-map';
import Maplibre, {type MaplibreProps} from '../maplibre/maplibre';
import createRef, {type MapRef} from '../maplibre/create-ref';
import setGlobals, {type GlobalSettings} from '../utils/set-globals';
import type {MapLib, MapOptions} from '../types/lib';

export type {CurrentMapContextValue as MapContextValue};

type MapInitOptions = Omit<MapOptions, 'style' | 'container' | 'bounds' | 'fitBoundsOptions' | 'center'>;

export type MapProps = MapInitOptions &
  MaplibreProps &
  GlobalSettings & {
    mapLib?: MapLib | Promise<MapLib>;
    reuseMaps?: boolean;
    id?: string;
    style?: JSX.CSSProperties;
    class?: string;
    classList?: JSX.HTMLAttributes<HTMLDivElement>['classList'];
    ref?: (map: MapRef) => void;
    children?: JSX.Element;
  };

const CHILD_CONTAINER_STYLE: JSX.CSSProperties = {
  height: '100%'
};

export function Map(props: MapProps) {
  let containerRef!: HTMLDivElement;
  let maplibre: Maplibre | undefined;
  const mountedMapsContext = useContext(MountedMapsContext);
  const [contextValue, setContextValue] = createSignal<CurrentMapContextValue>();
  const [mapInstance, setMapInstance] = createSignal<Maplibre>();

  const containerStyle = createMemo<JSX.CSSProperties>(() => ({
    position: 'relative',
    width: '100%',
    height: '100%',
    ...props.style
  }));

  const mapProps = () => {
    const [, rest] = splitProps(props, ['children', 'class', 'classList', 'ref', 'style']);
    return rest;
  };

  onMount(() => {
    let mounted = true;

    Promise.resolve(props.mapLib || import('maplibre-gl'))
      .then((module: MapLib | {default: MapLib}) => {
        if (!mounted) {
          return;
        }
        const mapLib = 'Map' in module ? module : module.default;
        if (!mapLib?.Map) {
          throw new Error('Invalid mapLib');
        }

        setGlobals(mapLib, props);
        if (props.reuseMaps) {
          maplibre = Maplibre.reuse(mapProps(), containerRef) || undefined;
        }
        if (!maplibre) {
          maplibre = new Maplibre(mapLib.Map, mapProps(), containerRef);
        }

        const mapRef = createRef(maplibre);
        if (!mapRef) {
          throw new Error('Unable to create map ref');
        }

        const value = {map: mapRef, mapLib};
        setContextValue(value);
        setMapInstance(maplibre);
        props.ref?.(mapRef);
        mountedMapsContext?.onMapMount(mapRef, props.id);
      })
      .catch(error => {
        if (props.onError) {
          props.onError({
            type: 'error',
            target: null,
            originalEvent: null,
            error
          });
        } else {
          console.error(error);
        }
      });

    onCleanup(() => {
      mounted = false;
      if (maplibre) {
        mountedMapsContext?.onMapUnmount(props.id);
        if (props.reuseMaps) {
          maplibre.recycle();
        } else {
          maplibre.destroy();
        }
      }
    });
  });

  createEffect(() => {
    const instance = mapInstance();
    if (instance) {
      instance.setProps(mapProps());
    }
  });

  return (
    <div id={props.id} ref={containerRef} class={props.class} classList={props.classList} style={containerStyle()}>
      <Show when={contextValue()}>
        {context => (
          <MapContext.Provider value={context()}>
            <div data-solid-maplibre-children="" style={CHILD_CONTAINER_STYLE}>
              {props.children}
            </div>
          </MapContext.Provider>
        )}
      </Show>
    </div>
  );
}
