import type {ScaleControlOptions} from 'maplibre-gl';
import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type ScaleControlProps = ScaleControlOptions & {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
};

export function ScaleControl(props: ScaleControlProps) {
  const control = useControl(
    ({mapLib}) => new mapLib.ScaleControl(props),
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
