import {vi} from 'vitest';
import type {PaddingOptions, ViewState} from '../../src/types/common';

type Listener = (event: Record<string, unknown>) => void;

export class FakeLngLat {
  constructor(
    readonly lng: number,
    readonly lat: number
  ) {}
}

export type FakeTransform = {
  center: FakeLngLat;
  zoom: number;
  pitch: number;
  bearing: number;
  padding?: PaddingOptions;
  width: number;
  height: number;
};

export function createFakeTransform(viewState: Partial<ViewState> = {}): FakeTransform {
  return {
    center: new FakeLngLat(viewState.longitude ?? 0, viewState.latitude ?? 0),
    zoom: viewState.zoom ?? 0,
    pitch: viewState.pitch ?? 0,
    bearing: viewState.bearing ?? 0,
    padding: viewState.padding,
    width: 640,
    height: 480
  };
}

export class FakeControlledMap {
  static instances: FakeControlledMap[] = [];

  options: Record<string, any>;
  transform: FakeTransform;
  transformCameraUpdate?: (transform: FakeTransform) => Partial<FakeTransform> | FakeTransform;
  style = {_loaded: true};
  moving = false;
  canvas = {style: {cursor: ''}};
  listeners = new Map<string, Set<Listener>>();
  sources = new Map<string, Record<string, unknown>>();
  layers = new Map<string, Record<string, unknown>>();
  queryResult: Record<string, unknown>[] = [];
  _frame: {cancel: ReturnType<typeof vi.fn>} | null = null;

  scrollZoom = createHandler();
  boxZoom = createHandler();
  dragRotate = createHandler();
  dragPan = createHandler();
  keyboard = createHandler();
  doubleClickZoom = createHandler();
  touchZoomRotate = createHandler();
  touchPitch = createHandler();

  setPadding = vi.fn((padding: PaddingOptions) => {
    this.transform.padding = padding;
  });

  getCanvas = vi.fn(() => this.canvas);
  getLight = vi.fn(() => undefined);
  getSky = vi.fn(() => undefined);
  getProjection = vi.fn(() => ({type: 'mercator'}));
  getTerrain = vi.fn(() => null);
  getSource = vi.fn((id: string) => this.sources.get(id));
  getLayer = vi.fn((id: string) => this.layers.get(id));
  queryRenderedFeatures = vi.fn(() => this.queryResult);
  setLight = vi.fn();
  setSky = vi.fn();
  setProjection = vi.fn();
  setTerrain = vi.fn();
  setStyle = vi.fn();
  setMinZoom = vi.fn();
  setMaxZoom = vi.fn();
  setMinPitch = vi.fn();
  setMaxPitch = vi.fn();
  setMaxBounds = vi.fn();
  setRenderWorldCopies = vi.fn();
  resize = vi.fn(() => {
    this.transform.width = this.options.viewState?.width ?? this.transform.width;
    this.transform.height = this.options.viewState?.height ?? this.transform.height;
  });
  _render = vi.fn();
  remove = vi.fn();

  constructor(options: Record<string, any>) {
    this.options = options;
    this.transform = createFakeTransform({
      longitude: options.center?.[0],
      latitude: options.center?.[1],
      zoom: options.zoom,
      pitch: options.pitch,
      bearing: options.bearing,
      padding: options.padding
    });
    FakeControlledMap.instances.push(this);
  }

  isMoving = vi.fn(() => this.moving);

  jumpTo = vi.fn((changes: Partial<FakeTransform>) => {
    Object.assign(this.transform, changes);
    this.fire('move');
  });

  on = vi.fn((eventName: string, listener: Listener) => {
    const listeners = this.listeners.get(eventName) || new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    return this;
  });

  once = vi.fn((eventName: string, listener: Listener) => {
    const onceListener: Listener = event => {
      this.off(eventName, onceListener);
      listener(event);
    };
    return this.on(eventName, onceListener);
  });

  off = vi.fn((eventName: string, listener: Listener) => {
    this.listeners.get(eventName)?.delete(listener);
    return this;
  });

  fire(eventName: string, event: Record<string, unknown> = {}) {
    const nextEvent = {type: eventName, target: this, ...event};
    for (const listener of this.listeners.get(eventName) || []) {
      listener(nextEvent);
    }
    return nextEvent;
  }
}

function createHandler() {
  return {
    enable: vi.fn(),
    disable: vi.fn()
  };
}
