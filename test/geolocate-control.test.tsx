import {render, waitFor} from '@solidjs/testing-library';
import {createSignal} from 'solid-js';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {GeolocateControl} from '../src/components/geolocate-control';
import type {MapContextValue} from '../src/components/map';
import {MapContext} from '../src/components/use-map';
import type {MapRef} from '../src/maplibre/create-ref';

type Listener = (event: Record<string, unknown>) => void;

class FakeGeolocateControl {
  static instances: FakeGeolocateControl[] = [];

  _container = document.createElement('div');
  _setupUI = vi.fn(() => {
    this._container.appendChild(document.createElement('button'));
  });
  listeners = new Map<string, Set<Listener>>();

  constructor(readonly options: Record<string, unknown>) {
    FakeGeolocateControl.instances.push(this);
  }

  on = vi.fn((eventName: string, listener: Listener) => {
    const listeners = this.listeners.get(eventName) || new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    return this;
  });

  onAdd = vi.fn(() => {
    this._setupUI();
    return this._container;
  });

  onRemove = vi.fn();

  fire(eventName: string, event: Record<string, unknown> = {}) {
    const nextEvent = {type: eventName, target: this, ...event};
    for (const listener of this.listeners.get(eventName) || []) {
      listener(nextEvent);
    }
    return nextEvent;
  }
}

function createControlContext() {
  const controls = new Set<unknown>();
  const mapRef = {
    getMap: () => ({}),
    hasControl: vi.fn((control: unknown) => controls.has(control)),
    addControl: vi.fn((control: {onAdd?: () => void}, position?: string) => {
      controls.add(control);
      control.onAdd?.();
      return position;
    }),
    removeControl: vi.fn((control: {onRemove?: () => void}) => {
      controls.delete(control);
      control.onRemove?.();
    })
  } as unknown as MapRef;

  const context = {
    map: mapRef,
    mapLib: {
      GeolocateControl: FakeGeolocateControl
    }
  } as unknown as MapContextValue;

  return {context, mapRef};
}

describe('GeolocateControl', () => {
  beforeEach(() => {
    FakeGeolocateControl.instances = [];
  });

  it('wires geolocate events and applies control options', async () => {
    const {context, mapRef} = createControlContext();
    const onGeolocate = vi.fn();
    const onError = vi.fn();
    const onOutOfMaxBounds = vi.fn();
    const onTrackUserLocationStart = vi.fn();
    const onTrackUserLocationEnd = vi.fn();

    render(() => (
      <MapContext.Provider value={context}>
        <GeolocateControl
          position="top-left"
          style={{color: 'red'}}
          onGeolocate={onGeolocate}
          onError={onError}
          onOutOfMaxBounds={onOutOfMaxBounds}
          onTrackUserLocationStart={onTrackUserLocationStart}
          onTrackUserLocationEnd={onTrackUserLocationEnd}
        />
      </MapContext.Provider>
    ));

    await waitFor(() => expect(FakeGeolocateControl.instances).toHaveLength(1));
    const control = FakeGeolocateControl.instances[0]!;

    expect(mapRef.addControl).toHaveBeenCalledWith(control, 'top-left');
    expect(control._container.style.color).toBe('red');

    control.fire('geolocate', {coords: {latitude: 1, longitude: 2}});
    control.fire('error', {code: 1});
    control.fire('outofmaxbounds', {coords: {latitude: 3, longitude: 4}});
    control.fire('trackuserlocationstart');
    control.fire('trackuserlocationend');

    expect(onGeolocate).toHaveBeenCalledWith(
      expect.objectContaining({type: 'geolocate', target: control})
    );
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({type: 'error', target: control}));
    expect(onOutOfMaxBounds).toHaveBeenCalledWith(
      expect.objectContaining({type: 'outofmaxbounds', target: control})
    );
    expect(onTrackUserLocationStart).toHaveBeenCalledWith(
      expect.objectContaining({type: 'trackuserlocationstart', target: control})
    );
    expect(onTrackUserLocationEnd).toHaveBeenCalledWith(
      expect.objectContaining({type: 'trackuserlocationend', target: control})
    );
  });

  it('uses the latest reactive geolocate handler', async () => {
    const {context} = createControlContext();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    let setHandler!: (handler: (event: unknown) => void) => void;

    function Fixture() {
      const [handler, updateHandler] = createSignal<(event: unknown) => void>(firstHandler);
      setHandler = nextHandler => updateHandler(() => nextHandler);

      return (
        <MapContext.Provider value={context}>
          <GeolocateControl onGeolocate={handler()} />
        </MapContext.Provider>
      );
    }

    render(() => <Fixture />);
    await waitFor(() => expect(FakeGeolocateControl.instances).toHaveLength(1));
    const control = FakeGeolocateControl.instances[0]!;

    setHandler(secondHandler);
    control.fire('geolocate');

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith(
      expect.objectContaining({type: 'geolocate', target: control})
    );
  });
});
