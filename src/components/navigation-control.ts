import type {NavigationControlOptions} from 'maplibre-gl';
import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type NavigationControlProps = NavigationControlOptions & {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
};

export function NavigationControl(props: NavigationControlProps) {
  const control = useControl(
    ({mapLib}) => new mapLib.NavigationControl(props),
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
