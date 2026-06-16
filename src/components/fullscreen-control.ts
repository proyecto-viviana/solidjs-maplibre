import type {FullscreenControlOptions} from 'maplibre-gl';
import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type FullscreenControlProps = FullscreenControlOptions & {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
};

export function FullscreenControl(props: FullscreenControlProps) {
  const control = useControl(
    ({mapLib}) => new mapLib.FullscreenControl(props),
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
