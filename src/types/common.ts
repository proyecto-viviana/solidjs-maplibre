import type {
  LngLat,
  LngLatLike,
  LngLatBounds,
  LngLatBoundsLike,
  MapGeoJSONFeature,
  PaddingOptions,
  Point,
  PointLike
} from 'maplibre-gl';

export type {
  LngLat,
  LngLatLike,
  LngLatBounds,
  LngLatBoundsLike,
  MapGeoJSONFeature,
  PaddingOptions,
  Point,
  PointLike
};

export interface ImmutableLike<T> {
  toJS(): T;
}

export type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
  padding?: PaddingOptions;
};
