import type {
  ErrorEvent,
  MapDataEvent,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  MapMouseEvent as MaplibreMouseEvent,
  MapTouchEvent,
  MapWheelEvent
} from 'maplibre-gl';
import type {ViewState} from './common';
import type {MapInstance, MarkerInstance, PopupInstance} from './lib';

export type MapEvent = {
  type: string;
  target: MapInstance | null;
  originalEvent?: Event | null;
  error?: Error;
} & Record<string, any>;

export type MapMouseEvent = (MaplibreMouseEvent | MapLayerMouseEvent) & {
  features?: MapGeoJSONFeature[];
};

export type MapTouchLikeEvent = (MapTouchEvent | MapLayerTouchEvent) & {
  features?: MapGeoJSONFeature[];
};

export type ViewStateChangeEvent = MapEvent & {
  viewState: ViewState;
};

export type MarkerEvent<TOriginalEvent = Event> = {
  type: string;
  target: MarkerInstance;
  originalEvent: TOriginalEvent;
};

export type MarkerDragEvent = MapEvent & {
  target: MarkerInstance;
  lngLat: ReturnType<MarkerInstance['getLngLat']>;
};

export type PopupEvent = MapEvent & {
  target: PopupInstance;
};

export type MapCallbacks = {
  onMouseDown?: (event: MapMouseEvent) => void;
  onMouseUp?: (event: MapMouseEvent) => void;
  onMouseOver?: (event: MapMouseEvent) => void;
  onMouseMove?: (event: MapMouseEvent) => void;
  onClick?: (event: MapMouseEvent) => void;
  onDblClick?: (event: MapMouseEvent) => void;
  onMouseEnter?: (event: MapMouseEvent) => void;
  onMouseLeave?: (event: MapMouseEvent) => void;
  onMouseOut?: (event: MapMouseEvent) => void;
  onContextMenu?: (event: MapMouseEvent) => void;
  onTouchStart?: (event: MapTouchLikeEvent) => void;
  onTouchEnd?: (event: MapTouchLikeEvent) => void;
  onTouchMove?: (event: MapTouchLikeEvent) => void;
  onTouchCancel?: (event: MapTouchLikeEvent) => void;
  onMoveStart?: (event: ViewStateChangeEvent) => void;
  onMove?: (event: ViewStateChangeEvent) => void;
  onMoveEnd?: (event: ViewStateChangeEvent) => void;
  onDragStart?: (event: ViewStateChangeEvent) => void;
  onDrag?: (event: ViewStateChangeEvent) => void;
  onDragEnd?: (event: ViewStateChangeEvent) => void;
  onZoomStart?: (event: ViewStateChangeEvent) => void;
  onZoom?: (event: ViewStateChangeEvent) => void;
  onZoomEnd?: (event: ViewStateChangeEvent) => void;
  onRotateStart?: (event: ViewStateChangeEvent) => void;
  onRotate?: (event: ViewStateChangeEvent) => void;
  onRotateEnd?: (event: ViewStateChangeEvent) => void;
  onPitchStart?: (event: ViewStateChangeEvent) => void;
  onPitch?: (event: ViewStateChangeEvent) => void;
  onPitchEnd?: (event: ViewStateChangeEvent) => void;
  onWheel?: (event: MapWheelEvent) => void;
  onBoxZoomStart?: (event: MapEvent) => void;
  onBoxZoomEnd?: (event: MapEvent) => void;
  onBoxZoomCancel?: (event: MapEvent) => void;
  onResize?: (event: MapEvent) => void;
  onLoad?: (event: MapEvent) => void;
  onRender?: (event: MapEvent) => void;
  onIdle?: (event: MapEvent) => void;
  onRemove?: (event: MapEvent) => void;
  onData?: (event: MapDataEvent) => void;
  onStyleData?: (event: MapDataEvent) => void;
  onSourceData?: (event: MapDataEvent) => void;
  onError?: (event: ErrorEvent | MapEvent) => void;
};
