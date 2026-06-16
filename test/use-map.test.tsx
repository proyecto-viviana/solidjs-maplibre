import {render, screen, waitFor, fireEvent} from '@solidjs/testing-library';
import {onMount, useContext} from 'solid-js';
import {describe, expect, it} from 'vitest';
import {
  MapContext,
  MapProvider,
  MountedMapsContext,
  type MountedMapsContextValue,
  useMap
} from '../src/components/use-map';
import type {MapRef} from '../src/maplibre/create-ref';

function fakeMapRef(id: string) {
  return {
    getMap: () => ({id})
  } as unknown as MapRef;
}

describe('MapProvider and useMap', () => {
  it('publishes named maps and removes them on unmount', async () => {
    const alpha = fakeMapRef('alpha');

    function Probe() {
      const mountedMaps = useContext(MountedMapsContext);
      const maps = useMap();

      onMount(() => {
        mountedMaps?.onMapMount(alpha, 'alpha');
      });

      return (
        <>
          <span>{maps.alpha === alpha ? 'mounted' : 'missing'}</span>
          <button onClick={() => mountedMaps?.onMapUnmount('alpha')}>remove</button>
        </>
      );
    }

    render(() => (
      <MapProvider>
        <Probe />
      </MapProvider>
    ));

    await waitFor(() => expect(screen.getByText('mounted')).toBeTruthy());
    fireEvent.click(screen.getByText('remove'));
    await waitFor(() => expect(screen.getByText('missing')).toBeTruthy());
  });

  it('exposes the current map from MapContext', () => {
    const current = fakeMapRef('current');

    function Probe() {
      const maps = useMap();
      return <span>{maps.current === current ? 'current' : 'missing'}</span>;
    }

    render(() => (
      <MapContext.Provider value={{map: current, mapLib: {} as never}}>
        <Probe />
      </MapContext.Provider>
    ));

    expect(screen.getByText('current')).toBeTruthy();
  });

  it('guards reserved and duplicate map ids', () => {
    let mountedMaps!: MountedMapsContextValue;

    function Probe() {
      mountedMaps = useContext(MountedMapsContext)!;
      return null;
    }

    render(() => (
      <MapProvider>
        <Probe />
      </MapProvider>
    ));

    const alpha = fakeMapRef('alpha');
    expect(() => mountedMaps.onMapMount(alpha, 'current')).toThrow("'current' cannot be used as map id");

    mountedMaps.onMapMount(alpha, 'alpha');
    expect(() => mountedMaps.onMapMount(fakeMapRef('alpha-2'), 'alpha')).toThrow(
      'Multiple maps with the same id: alpha'
    );
  });
});
