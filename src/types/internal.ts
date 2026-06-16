import type {PaddingOptions, MapGeoJSONFeature} from 'maplibre-gl';

export type TransformLike = {
  center: {
    lng: number;
    lat: number;
    constructor: any;
  };
  zoom: number;
  pitch: number;
  bearing: number;
  padding?: PaddingOptions;
  width?: number;
  height?: number;
};

export type AnySourceImplementation = {
  setCoordinates?: (coordinates: unknown) => void;
  setUrl?: (url: string) => void;
  setTiles?: (tiles: string[]) => void;
};

export type GeoJSONSourceImplementation = AnySourceImplementation & {
  setData: (data: unknown) => void;
};

export type ImageSourceImplementation = AnySourceImplementation & {
  updateImage: (options: {url: string; coordinates: unknown}) => void;
};

export type QueryFeature = MapGeoJSONFeature;
