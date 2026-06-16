import {render, waitFor} from '@solidjs/testing-library';
import {createSignal} from 'solid-js';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Map} from '../src/components/map';
import type {ViewState} from '../src/types/common';
import type {ViewStateChangeEvent} from '../src/types/events';
import type {StyleSpecification} from '../src/types/style-spec';
import {FakeControlledMap, FakeLngLat, createFakeTransform} from './fakes/fake-controlled-map';

const mapStyle: StyleSpecification = {version: 8, sources: {}, layers: []};
const fakeMapLib = {Map: FakeControlledMap} as never;

describe('Map controlled camera component behavior', () => {
  beforeEach(() => {
    FakeControlledMap.instances = [];
  });

  it('pushes reactive viewState changes into the MapLibre wrapper', async () => {
    let setViewState!: (viewState: ViewState & {width: number; height: number}) => void;

    function Fixture() {
      const [viewState, updateViewState] = createSignal<ViewState & {width: number; height: number}>({
        longitude: 0,
        latitude: 0,
        zoom: 1,
        pitch: 0,
        bearing: 0,
        width: 640,
        height: 480
      });
      setViewState = updateViewState;

      return <Map mapLib={fakeMapLib} mapStyle={mapStyle} viewState={viewState()} />;
    }

    const {unmount} = render(() => <Fixture />);

    await waitFor(() => expect(FakeControlledMap.instances).toHaveLength(1));
    const map = FakeControlledMap.instances[0]!;

    setViewState({
      longitude: -56.18,
      latitude: -34.92,
      zoom: 12,
      pitch: 35,
      bearing: -18,
      width: 640,
      height: 480
    });

    await waitFor(() => {
      expect(map.jumpTo).toHaveBeenCalledWith({
        center: new FakeLngLat(-56.18, -34.92),
        zoom: 12,
        pitch: 35,
        bearing: -18
      });
    });
    expect(map._render).toHaveBeenCalled();

    unmount();
    expect(map.remove).toHaveBeenCalled();
  });

  it('lets onMove feed proposed interaction camera state back into viewState', async () => {
    let setViewState!: (viewState: ViewState & {width: number; height: number}) => void;
    const onMove = vi.fn((event: ViewStateChangeEvent) => {
      setViewState({
        ...event.viewState,
        width: 640,
        height: 480
      });
    });

    function Fixture() {
      const [viewState, updateViewState] = createSignal<ViewState & {width: number; height: number}>({
        longitude: 0,
        latitude: 0,
        zoom: 1,
        pitch: 0,
        bearing: 0,
        width: 640,
        height: 480
      });
      setViewState = updateViewState;

      return <Map mapLib={fakeMapLib} mapStyle={mapStyle} viewState={viewState()} onMove={onMove} />;
    }

    render(() => <Fixture />);

    await waitFor(() => expect(FakeControlledMap.instances).toHaveLength(1));
    const map = FakeControlledMap.instances[0]!;
    const proposedTransform = createFakeTransform({
      longitude: -56.2,
      latitude: -34.91,
      zoom: 13,
      pitch: 45,
      bearing: -28
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
          longitude: -56.2,
          latitude: -34.91,
          zoom: 13,
          pitch: 45,
          bearing: -28,
          padding: undefined
        }
      })
    );
    await waitFor(() => {
      expect(map.jumpTo).toHaveBeenCalledWith({
        center: new FakeLngLat(-56.2, -34.91),
        zoom: 13,
        pitch: 45,
        bearing: -28
      });
    });
  });
});
