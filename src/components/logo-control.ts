import type {LogoControlOptions} from 'maplibre-gl';
import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type LogoControlProps = LogoControlOptions & {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
};

export function LogoControl(props: LogoControlProps) {
  const control = useControl(
    ({mapLib}) => new mapLib.LogoControl(props),
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
