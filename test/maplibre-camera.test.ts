import {beforeEach, describe, expect, it, vi} from 'vitest';
import Maplibre from '../src/maplibre/maplibre';
import {FakeControlledMap, FakeLngLat, createFakeTransform} from './fakes/fake-controlled-map';

function createWrapper(props: Record<string, any> = {}) {
  const container = document.createElement('div');
  const wrapper = new Maplibre(FakeControlledMap as never, props, container);
  const map = FakeControlledMap.instances[FakeControlledMap.instances.length - 1]!;

  return {wrapper, map, container};
}

describe('Maplibre controlled camera behavior', () => {
  beforeEach(() => {
    FakeControlledMap.instances = [];
  });

  it('initializes the map camera from initialViewState', () => {
    const {map} = createWrapper({
      initialViewState: {
        longitude: -56.18,
        latitude: -34.91,
        zoom: 11,
        pitch: 35,
        bearing: 15,
        padding: {top: 8, right: 16, bottom: 24, left: 32}
      }
    });

    expect(map.options.center).toEqual([-56.18, -34.91]);
    expect(map.options.zoom).toBe(11);
    expect(map.options.pitch).toBe(35);
    expect(map.options.bearing).toBe(15);
    expect(map.setPadding).toHaveBeenCalledWith({top: 8, right: 16, bottom: 24, left: 32});
  });

  it('prefers controlled viewState over loose camera props during initialization', () => {
    const {map} = createWrapper({
      longitude: 1,
      latitude: 2,
      zoom: 3,
      viewState: {
        longitude: 10,
        latitude: 20,
        zoom: 7,
        pitch: 25,
        bearing: 30,
        width: 800,
        height: 600
      }
    });

    expect(map.options.center).toEqual([10, 20]);
    expect(map.options.zoom).toBe(7);
    expect(map.options.pitch).toBe(25);
    expect(map.options.bearing).toBe(30);
  });

  it('jumps and redraws when external camera props change', () => {
    const {wrapper, map} = createWrapper({
      longitude: -56,
      latitude: -34,
      zoom: 10,
      pitch: 0,
      bearing: 0
    });

    wrapper.setProps({
      longitude: -57,
      latitude: -35,
      zoom: 12,
      pitch: 20,
      bearing: 45
    });

    expect(map.jumpTo).toHaveBeenCalledWith({
      center: new FakeLngLat(-57, -35),
      zoom: 12,
      pitch: 20,
      bearing: 45
    });
    expect(map._render).toHaveBeenCalled();
    expect(map.transform.center).toEqual(new FakeLngLat(-57, -35));
    expect(map.transform.zoom).toBe(12);
  });

  it('does not call camera callbacks for internal jumpTo updates', () => {
    const onMove = vi.fn();
    const {wrapper, map} = createWrapper({
      longitude: 0,
      latitude: 0,
      zoom: 1,
      onMove
    });

    wrapper.setProps({
      longitude: 1,
      latitude: 2,
      zoom: 3,
      onMove
    });

    expect(map.jumpTo).toHaveBeenCalled();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('resizes when controlled viewState dimensions change', () => {
    const {wrapper, map} = createWrapper({
      viewState: {
        longitude: 0,
        latitude: 0,
        zoom: 1,
        pitch: 0,
        bearing: 0,
        width: 640,
        height: 480
      }
    });

    wrapper.setProps({
      viewState: {
        longitude: 0,
        latitude: 0,
        zoom: 1,
        pitch: 0,
        bearing: 0,
        width: 900,
        height: 700
      }
    });

    expect(map.resize).toHaveBeenCalled();
    expect(map._render).toHaveBeenCalled();
  });

  it('does not jump during an active map movement', () => {
    const {wrapper, map} = createWrapper({
      longitude: 0,
      latitude: 0,
      zoom: 1
    });
    map.moving = true;

    wrapper.setProps({
      longitude: 10,
      latitude: 20,
      zoom: 4
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  it('attaches proposed interaction view state to camera events', () => {
    const onMove = vi.fn();
    const {map} = createWrapper({
      longitude: 0,
      latitude: 0,
      zoom: 1,
      pitch: 0,
      bearing: 0,
      onMove
    });
    const proposedTransform = createFakeTransform({
      longitude: 5,
      latitude: 6,
      zoom: 7,
      pitch: 8,
      bearing: 9
    });

    const controlledChanges = map.transformCameraUpdate?.(proposedTransform);
    map.fire('move');

    expect(controlledChanges).toEqual({
      center: new FakeLngLat(0, 0),
      zoom: 1,
      pitch: 0,
      bearing: 0
    });
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'move',
        viewState: {
          longitude: 5,
          latitude: 6,
          zoom: 7,
          pitch: 8,
          bearing: 9,
          padding: undefined
        }
      })
    );
  });
});
