import type {GeolocateControlOptions} from 'maplibre-gl';
import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import type {GeolocateErrorEvent, GeolocateEvent, GeolocateResultEvent} from '../types/events';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type GeolocateControlProps = GeolocateControlOptions & {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
  onGeolocate?: (event: GeolocateResultEvent) => void;
  onError?: (event: GeolocateErrorEvent) => void;
  onOutOfMaxBounds?: (event: GeolocateResultEvent) => void;
  onTrackUserLocationStart?: (event: GeolocateEvent) => void;
  onTrackUserLocationEnd?: (event: GeolocateEvent) => void;
};

export function GeolocateControl(props: GeolocateControlProps) {
  const control = useControl(
    ({mapLib}) => {
      const geolocate = new mapLib.GeolocateControl(props);
      const setupUI = (geolocate as any)._setupUI;
      if (setupUI) {
        (geolocate as any)._setupUI = () => {
          if (!(geolocate as any)._container?.hasChildNodes()) {
            setupUI.call(geolocate);
          }
        };
      }

      geolocate.on('geolocate', event => props.onGeolocate?.(event as GeolocateResultEvent));
      geolocate.on('error', event => props.onError?.(event as GeolocateErrorEvent));
      geolocate.on('outofmaxbounds', event =>
        props.onOutOfMaxBounds?.(event as GeolocateResultEvent)
      );
      geolocate.on('trackuserlocationstart', event =>
        props.onTrackUserLocationStart?.(event as GeolocateEvent)
      );
      geolocate.on('trackuserlocationend', event =>
        props.onTrackUserLocationEnd?.(event as GeolocateEvent)
      );

      return geolocate;
    },
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
