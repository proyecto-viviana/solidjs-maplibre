import type {
  ControlPosition,
  CustomLayerInterface,
  IControl,
  Map as MapLibreMap,
  MapOptions,
  AttributionControl,
  AttributionControlOptions,
  FullscreenControl,
  FullscreenControlOptions,
  GeolocateControl,
  GeolocateControlOptions,
  GlobeControl,
  LogoControl,
  LogoControlOptions,
  Marker,
  MarkerOptions,
  NavigationControl,
  NavigationControlOptions,
  Popup,
  PopupOptions,
  ScaleControl,
  ScaleControlOptions,
  TerrainControl,
  TerrainSpecification
} from 'maplibre-gl';

export type {
  AttributionControlOptions,
  ControlPosition,
  CustomLayerInterface,
  FullscreenControlOptions,
  GeolocateControlOptions,
  IControl,
  LogoControlOptions,
  MapOptions,
  MarkerOptions,
  NavigationControlOptions,
  PopupOptions,
  ScaleControlOptions
};

export type MapInstance = MapLibreMap & Record<string, any>;

export type MarkerInstance = Marker;

export type PopupInstance = Popup;

export type AttributionControlInstance = AttributionControl;
export type FullscreenControlInstance = FullscreenControl;
export type GeolocateControlInstance = GeolocateControl;
export type NavigationControlInstance = NavigationControl;
export type ScaleControlInstance = ScaleControl;
export type TerrainControlInstance = TerrainControl;
export type LogoControlInstance = LogoControl;
export type GlobeControlInstance = GlobeControl;

export interface MapLib {
  supported?: (options: any) => boolean;
  Map: {new (options: MapOptions): MapInstance};
  Marker: {new (options: MarkerOptions): Marker};
  Popup: {new (options: PopupOptions): Popup};
  AttributionControl: {new (options: AttributionControlOptions): AttributionControl};
  FullscreenControl: {new (options: FullscreenControlOptions): FullscreenControl};
  GeolocateControl: {new (options: GeolocateControlOptions): GeolocateControl};
  NavigationControl: {new (options: NavigationControlOptions): NavigationControl};
  ScaleControl: {new (options: ScaleControlOptions): ScaleControl};
  TerrainControl: {new (options: TerrainSpecification): TerrainControl};
  LogoControl: {new (options: LogoControlOptions): LogoControl};
  GlobeControl: {new (options: any): GlobeControl};
}
