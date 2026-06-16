import type {
  LngLatBoundsLike,
  MapGeoJSONFeature,
  PaddingOptions,
  PointLike
} from 'maplibre-gl';

export type {LngLatBoundsLike, MapGeoJSONFeature, PaddingOptions, PointLike};

export type ImmutableLike<T> = {
  toJS(): T;
};

export type Point = PointLike;

export type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
  padding?: PaddingOptions;
};
