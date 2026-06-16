import {transformToViewState, applyViewStateToTransform} from '../utils/transform';
import {normalizeStyle} from '../utils/style-utils';
import {deepEqual} from '../utils/deep-equal';

import type {TransformLike} from '../types/internal';
import type {
  ImmutableLike,
  LngLatBoundsLike,
  MapGeoJSONFeature,
  PaddingOptions,
  Point,
  PointLike,
  ViewState
} from '../types/common';
import type {
  LightSpecification,
  ProjectionSpecification,
  SkySpecification,
  StyleSpecification,
  TerrainSpecification
} from '../types/style-spec';
import type {MapInstance} from '../types/lib';
import type {
  MapCallbacks,
  MapEvent,
  MapMouseEvent,
  ViewStateChangeEvent
} from '../types/events';

export type MaplibreProps = Partial<ViewState> &
  MapCallbacks & {
    initialViewState?: Partial<ViewState> & {
      bounds?: LngLatBoundsLike;
      fitBoundsOptions?: {
        offset?: PointLike;
        minZoom?: number;
        maxZoom?: number;
        padding?: number | PaddingOptions;
      };
    };
    gl?: WebGLRenderingContext;
    viewState?: ViewState & {
      width: number;
      height: number;
    };
    mapStyle?: string | StyleSpecification | ImmutableLike<StyleSpecification>;
    styleDiffing?: boolean;
    localIdeographFontFamily?: string;
    projection?: ProjectionSpecification | 'mercator' | 'globe';
    light?: LightSpecification;
    terrain?: TerrainSpecification | null;
    sky?: SkySpecification;
    interactiveLayerIds?: string[];
    cursor?: string;
  };

const DEFAULT_STYLE = {version: 8, sources: {}, layers: []} as StyleSpecification;

const DEFAULT_SETTINGS: Record<string, unknown> = {
  minZoom: 0,
  maxZoom: 22,
  minPitch: 0,
  maxPitch: 85,
  maxBounds: [-180, -85.051129, 180, 85.051129],
  renderWorldCopies: true
};

const pointerEvents: Record<string, keyof MapCallbacks> = {
  mousedown: 'onMouseDown',
  mouseup: 'onMouseUp',
  mouseover: 'onMouseOver',
  mousemove: 'onMouseMove',
  click: 'onClick',
  dblclick: 'onDblClick',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
  mouseout: 'onMouseOut',
  contextmenu: 'onContextMenu',
  touchstart: 'onTouchStart',
  touchend: 'onTouchEnd',
  touchmove: 'onTouchMove',
  touchcancel: 'onTouchCancel'
};

const cameraEvents: Record<string, keyof MapCallbacks> = {
  movestart: 'onMoveStart',
  move: 'onMove',
  moveend: 'onMoveEnd',
  dragstart: 'onDragStart',
  drag: 'onDrag',
  dragend: 'onDragEnd',
  zoomstart: 'onZoomStart',
  zoom: 'onZoom',
  zoomend: 'onZoomEnd',
  rotatestart: 'onRotateStart',
  rotate: 'onRotate',
  rotateend: 'onRotateEnd',
  pitchstart: 'onPitchStart',
  pitch: 'onPitch',
  pitchend: 'onPitchEnd'
};

const otherEvents: Record<string, keyof MapCallbacks> = {
  wheel: 'onWheel',
  boxzoomstart: 'onBoxZoomStart',
  boxzoomend: 'onBoxZoomEnd',
  boxzoomcancel: 'onBoxZoomCancel',
  resize: 'onResize',
  load: 'onLoad',
  render: 'onRender',
  idle: 'onIdle',
  remove: 'onRemove',
  data: 'onData',
  styledata: 'onStyleData',
  sourcedata: 'onSourceData',
  error: 'onError'
};

const settingNames = [
  'minZoom',
  'maxZoom',
  'minPitch',
  'maxPitch',
  'maxBounds',
  'renderWorldCopies'
];

const handlerNames = [
  'scrollZoom',
  'boxZoom',
  'dragRotate',
  'dragPan',
  'keyboard',
  'doubleClickZoom',
  'touchZoomRotate',
  'touchPitch'
];

export default class Maplibre {
  private _MapClass: {new (options: any): MapInstance};
  private _map: MapInstance | null = null;
  props: MaplibreProps;
  private _internalUpdate = false;
  private _hoveredFeatures: MapGeoJSONFeature[] | null = null;
  private _proposedCameraUpdate: ViewState | null = null;
  private _styleComponents: {
    light?: LightSpecification;
    sky?: SkySpecification;
    projection?: ProjectionSpecification;
    terrain?: TerrainSpecification | null;
  } = {};

  static savedMaps: Maplibre[] = [];

  constructor(
    MapClass: {new (options: any): MapInstance},
    props: MaplibreProps,
    container: HTMLDivElement
  ) {
    this._MapClass = MapClass;
    this.props = props;
    this._initialize(container);
  }

  get map(): MapInstance {
    if (!this._map) {
      throw new Error('Map has not been initialized');
    }
    return this._map;
  }

  setProps(props: MaplibreProps) {
    const oldProps = this.props;
    this.props = props;

    const settingsChanged = this._updateSettings(props, oldProps);
    const sizeChanged = this._updateSize(props);
    const viewStateChanged = this._updateViewState(props);
    this._updateStyle(props, oldProps);
    this._updateStyleComponents(props);
    this._updateHandlers(props, oldProps);

    if (settingsChanged || sizeChanged || (viewStateChanged && !this.map.isMoving())) {
      this.redraw();
    }
  }

  static reuse(props: MaplibreProps, container: HTMLDivElement): Maplibre | null {
    const that = Maplibre.savedMaps.pop();
    if (!that) {
      return null;
    }

    const map = that.map;
    const oldContainer = map.getContainer();
    container.className = oldContainer.className;
    while (oldContainer.childNodes.length > 0) {
      container.appendChild(oldContainer.childNodes[0]);
    }
    map._container = container;

    const resizeObserver = map._resizeObserver;
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver.observe(container);
    }

    that.setProps({...props, styleDiffing: false});
    map.resize();

    const {initialViewState} = props;
    if (initialViewState) {
      if (initialViewState.bounds) {
        map.fitBounds(initialViewState.bounds, {...initialViewState.fitBoundsOptions, duration: 0});
      } else {
        that._updateViewState(initialViewState);
      }
    }

    if (map.isStyleLoaded()) {
      map.fire('load');
    } else {
      map.once('style.load', () => map.fire('load'));
    }
    map._update();
    return that;
  }

  private _initialize(container: HTMLDivElement) {
    const {props} = this;
    const {mapStyle = DEFAULT_STYLE} = props;
    const mapOptions: Record<string, any> = {
      ...props,
      ...props.initialViewState,
      container,
      style: normalizeStyle(mapStyle)
    };

    const viewState = mapOptions.initialViewState || mapOptions.viewState || mapOptions;
    Object.assign(mapOptions, {
      center: [viewState.longitude || 0, viewState.latitude || 0],
      zoom: viewState.zoom || 0,
      pitch: viewState.pitch || 0,
      bearing: viewState.bearing || 0
    });

    if (props.gl) {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getInjectedContext() {
        HTMLCanvasElement.prototype.getContext = getContext;
        return props.gl;
      } as unknown as typeof HTMLCanvasElement.prototype.getContext;
    }

    const map = new this._MapClass(mapOptions);
    if (viewState.padding) {
      map.setPadding(viewState.padding);
    }
    if (props.cursor) {
      map.getCanvas().style.cursor = props.cursor;
    }

    map.transformCameraUpdate = this._onCameraUpdate as any;
    map.on('style.load', () => {
      this._styleComponents = {
        light: map.getLight(),
        sky: map.getSky(),
        projection: map.getProjection?.(),
        terrain: map.getTerrain()
      };
      this._updateStyleComponents(this.props);
    });
    map.on('sourcedata', () => {
      this._updateStyleComponents(this.props);
    });
    for (const eventName in pointerEvents) {
      map.on(eventName, this._onPointerEvent);
    }
    for (const eventName in cameraEvents) {
      map.on(eventName, this._onCameraEvent);
    }
    for (const eventName in otherEvents) {
      map.on(eventName, this._onEvent);
    }

    this._map = map;
  }

  recycle() {
    const container = this.map.getContainer();
    const children = container.querySelector('[data-solid-maplibre-children]');
    children?.remove();
    Maplibre.savedMaps.push(this);
  }

  destroy() {
    this.map.remove();
  }

  redraw() {
    const map = this.map;
    if (map.style) {
      if (map._frame) {
        map._frame.cancel();
        map._frame = null;
      }
      map._render(performance.now());
    }
  }

  private _updateSize(nextProps: MaplibreProps): boolean {
    const {viewState} = nextProps;
    if (viewState) {
      const map = this.map;
      if (viewState.width !== map.transform.width || viewState.height !== map.transform.height) {
        map.resize();
        return true;
      }
    }
    return false;
  }

  private _updateViewState(nextProps: MaplibreProps): boolean {
    const map = this.map;
    const tr = map.transform as TransformLike;
    const isMoving = map.isMoving();

    if (!isMoving) {
      const changes = applyViewStateToTransform(tr, nextProps);
      if (Object.keys(changes).length > 0) {
        this._internalUpdate = true;
        map.jumpTo(changes);
        this._internalUpdate = false;
        return true;
      }
    }

    return false;
  }

  private _updateSettings(nextProps: MaplibreProps, currProps: MaplibreProps): boolean {
    const map = this.map;
    const nextRecord = nextProps as Record<string, unknown>;
    const currRecord = currProps as Record<string, unknown>;
    let changed = false;

    for (const propName of settingNames) {
      const propPresent = propName in nextProps || propName in currProps;
      if (propPresent && !deepEqual(nextRecord[propName], currRecord[propName])) {
        changed = true;
        const nextValue = propName in nextProps ? nextRecord[propName] : DEFAULT_SETTINGS[propName];
        const setter = map[`set${propName[0].toUpperCase()}${propName.slice(1)}`];
        setter?.call(map, nextValue);
      }
    }

    return changed;
  }

  private _updateStyle(nextProps: MaplibreProps, currProps: MaplibreProps): void {
    if (nextProps.cursor !== currProps.cursor) {
      this.map.getCanvas().style.cursor = nextProps.cursor || '';
    }
    if (nextProps.mapStyle !== currProps.mapStyle) {
      const {mapStyle = DEFAULT_STYLE, styleDiffing = true} = nextProps;
      const options: Record<string, unknown> = {
        diff: styleDiffing
      };
      if ('localIdeographFontFamily' in nextProps) {
        options.localIdeographFontFamily = nextProps.localIdeographFontFamily;
      }
      this.map.setStyle(normalizeStyle(mapStyle), options);
    }
  }

  private _updateStyleComponents({light, projection, sky, terrain}: MaplibreProps): void {
    const map = this.map;
    const currProps = this._styleComponents;

    if (map.style?._loaded) {
      if (light && !deepEqual(light, currProps.light)) {
        currProps.light = light;
        map.setLight(light);
      }
      if (
        projection &&
        !deepEqual(projection, currProps.projection) &&
        projection !== currProps.projection?.type
      ) {
        currProps.projection = typeof projection === 'string' ? {type: projection} : projection;
        map.setProjection?.(currProps.projection);
      }
      if (sky && !deepEqual(sky, currProps.sky)) {
        currProps.sky = sky;
        map.setSky(sky);
      }
      if (terrain !== undefined && !deepEqual(terrain, currProps.terrain)) {
        if (!terrain || map.getSource(terrain.source)) {
          currProps.terrain = terrain;
          map.setTerrain(terrain);
        }
      }
    }
  }

  private _updateHandlers(nextProps: MaplibreProps, currProps: MaplibreProps): void {
    const map = this.map;
    const nextRecord = nextProps as Record<string, unknown>;
    const currRecord = currProps as Record<string, unknown>;
    for (const propName of handlerNames) {
      const newValue = nextRecord[propName] ?? true;
      const oldValue = currRecord[propName] ?? true;
      if (!deepEqual(newValue, oldValue)) {
        if (newValue) {
          map[propName].enable(newValue);
        } else {
          map[propName].disable();
        }
      }
    }
  }

  private _onEvent = (event: MapEvent) => {
    const callback = this.props[otherEvents[event.type]];
    if (callback) {
      callback(event as never);
    } else if (event.type === 'error') {
      console.error((event as {error?: Error}).error);
    }
  };

  private _onCameraEvent = (event: ViewStateChangeEvent) => {
    if (this._internalUpdate) {
      return;
    }
    event.viewState =
      this._proposedCameraUpdate || transformToViewState(this.map.transform as unknown as TransformLike);
    const callback = this.props[cameraEvents[event.type]];
    callback?.(event as never);
  };

  private _onCameraUpdate = (tr: TransformLike) => {
    if (this._internalUpdate) {
      return tr;
    }
    this._proposedCameraUpdate = transformToViewState(tr);
    return applyViewStateToTransform(tr, this.props);
  };

  private _queryRenderedFeatures(point: Point) {
    const map = this.map;
    const {interactiveLayerIds = []} = this.props;
    try {
      return map.queryRenderedFeatures(point, {
        layers: interactiveLayerIds.filter(map.getLayer.bind(map))
      });
    } catch {
      return [];
    }
  }

  private _updateHover(event: MapMouseEvent) {
    const {props} = this;
    const shouldTrackHoveredFeatures =
      props.interactiveLayerIds && (props.onMouseMove || props.onMouseEnter || props.onMouseLeave);

    if (shouldTrackHoveredFeatures) {
      const eventType = event.type;
      const wasHovering = Boolean(this._hoveredFeatures?.length);
      const features = this._queryRenderedFeatures(event.point);
      const isHovering = features.length > 0;

      if (!isHovering && wasHovering) {
        event.type = 'mouseleave';
        this._onPointerEvent(event);
      }
      this._hoveredFeatures = features;
      if (isHovering && !wasHovering) {
        event.type = 'mouseenter';
        this._onPointerEvent(event);
      }
      event.type = eventType;
    } else {
      this._hoveredFeatures = null;
    }
  }

  private _onPointerEvent = (event: MapMouseEvent) => {
    if (event.type === 'mousemove' || event.type === 'mouseout') {
      this._updateHover(event);
    }

    const callback = this.props[pointerEvents[event.type]];
    if (callback) {
      if (this.props.interactiveLayerIds && event.type !== 'mouseover' && event.type !== 'mouseout') {
        event.features = this._hoveredFeatures || this._queryRenderedFeatures(event.point);
      }
      callback(event as never);
      delete event.features;
    }
  };
}
