import {render, waitFor} from '@solidjs/testing-library';
import {createSignal, Show} from 'solid-js';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Map} from '../src/components/map';
import Maplibre, {type MaplibreProps} from '../src/maplibre/maplibre';
import {FakeControlledMap, FakeLngLat} from './fakes/fake-controlled-map';

function createWrapper(props: MaplibreProps = {}) {
  const container = document.createElement('div');
  const wrapper = new Maplibre(FakeControlledMap as never, props, container);
  const map = FakeControlledMap.instances[FakeControlledMap.instances.length - 1]!;

  return {wrapper, map, container};
}

function appendSolidChild(container: HTMLDivElement) {
  const child = document.createElement('div');
  child.setAttribute('data-solid-maplibre-children', '');
  container.appendChild(child);
  return child;
}

describe('Maplibre map reuse', () => {
  beforeEach(() => {
    FakeControlledMap.instances = [];
    Maplibre.savedMaps = [];
  });

  it('returns null when no saved map is available', () => {
    const container = document.createElement('div');

    expect(Maplibre.reuse({}, container)).toBeNull();
  });

  it('recycles a map without keeping the Solid child container', () => {
    const {wrapper, map, container} = createWrapper();
    appendSolidChild(container);

    wrapper.recycle();

    expect(container.querySelector('[data-solid-maplibre-children]')).toBeNull();
    expect(container.querySelector('[data-fake-maplibre-canvas]')).toBeTruthy();
    expect(Maplibre.savedMaps).toEqual([wrapper]);
    expect(map.remove).not.toHaveBeenCalled();
  });

  it('reuses the saved map in a new container and restores props', () => {
    const {wrapper, map, container: oldContainer} = createWrapper({
      mapStyle: 'maplibre://initial',
      longitude: 0,
      latitude: 0,
      zoom: 1,
      cursor: 'grab'
    });
    const mapCanvas = oldContainer.querySelector('[data-fake-maplibre-canvas]');
    const onLoad = vi.fn();
    const nextContainer = document.createElement('div');

    appendSolidChild(oldContainer);
    wrapper.recycle();

    const reused = Maplibre.reuse(
      {
        mapStyle: 'maplibre://next',
        initialViewState: {
          longitude: 10,
          latitude: 20,
          zoom: 6,
          pitch: 45,
          bearing: 30
        },
        cursor: 'crosshair',
        onLoad
      },
      nextContainer
    );

    expect(reused).toBe(wrapper);
    expect(FakeControlledMap.instances).toHaveLength(1);
    expect(nextContainer.querySelector('[data-fake-maplibre-canvas]')).toBe(mapCanvas);
    expect(oldContainer.childNodes).toHaveLength(0);
    expect(map.getContainer()).toBe(nextContainer);
    expect(map._resizeObserver.disconnect).toHaveBeenCalled();
    expect(map._resizeObserver.observe).toHaveBeenCalledWith(nextContainer);
    expect(map.setStyle).toHaveBeenCalledWith('maplibre://next', {diff: false});
    expect(map.getCanvas().style.cursor).toBe('crosshair');
    expect(map.jumpTo).toHaveBeenCalledWith({
      center: new FakeLngLat(10, 20),
      zoom: 6,
      pitch: 45,
      bearing: 30
    });
    expect(map.resize).toHaveBeenCalled();
    expect(map._update).toHaveBeenCalled();
    expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({type: 'load', target: map}));
  });

  it('restores initial bounds when reusing a map', () => {
    const {wrapper, map} = createWrapper();
    const nextContainer = document.createElement('div');
    const bounds: [[number, number], [number, number]] = [
      [-57, -35],
      [-56, -34]
    ];

    wrapper.recycle();

    Maplibre.reuse(
      {
        initialViewState: {
          bounds,
          fitBoundsOptions: {
            padding: 24,
            maxZoom: 12
          }
        }
      },
      nextContainer
    );

    expect(map.fitBounds).toHaveBeenCalledWith(bounds, {
      padding: 24,
      maxZoom: 12,
      duration: 0
    });
  });

  it('uses a recycled map when the Solid Map remounts with reuseMaps', async () => {
    let setVisible!: (visible: boolean) => void;
    let setInitialViewState!: (viewState: {longitude: number; latitude: number; zoom: number}) => void;
    const mapLib = {Map: FakeControlledMap} as never;

    function Fixture() {
      const [visible, updateVisible] = createSignal(true);
      const [initialViewState, updateInitialViewState] = createSignal({
        longitude: 1,
        latitude: 2,
        zoom: 3
      });
      setVisible = updateVisible;
      setInitialViewState = updateInitialViewState;

      return (
        <Show when={visible()}>
          <Map id="reused-map" mapLib={mapLib} reuseMaps initialViewState={initialViewState()} />
        </Show>
      );
    }

    render(() => <Fixture />);
    await waitFor(() => expect(FakeControlledMap.instances).toHaveLength(1));
    const map = FakeControlledMap.instances[0]!;

    setVisible(false);
    await waitFor(() => expect(Maplibre.savedMaps).toHaveLength(1));
    expect(map.remove).not.toHaveBeenCalled();

    setInitialViewState({longitude: 4, latitude: 5, zoom: 6});
    setVisible(true);
    await waitFor(() => expect(Maplibre.savedMaps).toHaveLength(0));
    expect(FakeControlledMap.instances).toHaveLength(1);
    expect(map.jumpTo).toHaveBeenCalledWith({
      center: new FakeLngLat(4, 5),
      zoom: 6
    });
  });
});
