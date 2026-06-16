import type {AttributionControlOptions} from 'maplibre-gl';
import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type AttributionControlProps = AttributionControlOptions & {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
};

export function AttributionControl(props: AttributionControlProps) {
  const control = useControl(
    ({mapLib}) => new mapLib.AttributionControl(props),
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
