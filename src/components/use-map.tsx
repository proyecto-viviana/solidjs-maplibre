import {createContext, createSignal, JSX, useContext} from 'solid-js';
import type {MapRef} from '../maplibre/create-ref';
import type {MapLib} from '../types/lib';

export type MountedMapsContextValue = {
  maps: () => Record<string, MapRef>;
  onMapMount: (map: MapRef, id?: string) => void;
  onMapUnmount: (id?: string) => void;
};

export const MountedMapsContext = createContext<MountedMapsContextValue>();

export type MapCollection = {
  [id: string]: MapRef | undefined;
  current?: MapRef;
};

export type CurrentMapContextValue = {
  map: MapRef;
  mapLib: MapLib;
};

export const MapContext = createContext<CurrentMapContextValue>();

export function MapProvider(props: {children?: JSX.Element}) {
  const [maps, setMaps] = createSignal<Record<string, MapRef>>({});

  const onMapMount = (map: MapRef, id = 'default') => {
    setMaps(currentMaps => {
      if (id === 'current') {
        throw new Error("'current' cannot be used as map id");
      }
      if (currentMaps[id]) {
        throw new Error(`Multiple maps with the same id: ${id}`);
      }
      return {...currentMaps, [id]: map};
    });
  };

  const onMapUnmount = (id = 'default') => {
    setMaps(currentMaps => {
      if (!currentMaps[id]) {
        return currentMaps;
      }
      const nextMaps = {...currentMaps};
      delete nextMaps[id];
      return nextMaps;
    });
  };

  return (
    <MountedMapsContext.Provider value={{maps, onMapMount, onMapUnmount}}>
      {props.children}
    </MountedMapsContext.Provider>
  );
}

export function useMap(): MapCollection {
  const mountedMaps = useContext(MountedMapsContext);
  const currentMap = useContext(MapContext);

  return new Proxy({} as MapCollection, {
    get(_, property) {
      if (property === 'current') {
        return currentMap?.map;
      }
      if (typeof property === 'string') {
        return mountedMaps?.maps()[property];
      }
      return undefined;
    },
    ownKeys() {
      return Array.from(new Set([...Object.keys(mountedMaps?.maps() || {}), 'current']));
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true
      };
    }
  });
}
