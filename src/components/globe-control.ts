import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type GlobeControlProps = {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
};

export function GlobeControl(props: GlobeControlProps) {
  const control = useControl(
    ({mapLib}) => new mapLib.GlobeControl(props),
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
