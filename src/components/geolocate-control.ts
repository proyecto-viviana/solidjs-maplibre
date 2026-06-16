import type {GeolocateControlOptions} from 'maplibre-gl';
import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type GeolocateControlProps = GeolocateControlOptions & {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
};

export function GeolocateControl(props: GeolocateControlProps) {
  const control = useControl(
    ({mapLib}) => new mapLib.GeolocateControl(props),
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
