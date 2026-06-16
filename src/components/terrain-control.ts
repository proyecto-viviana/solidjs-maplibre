import {createEffect, type JSX} from 'solid-js';
import type {ControlPosition} from '../types/lib';
import type {TerrainSpecification} from '../types/style-spec';
import {applyDomStyle} from '../utils/apply-dom-style';
import {useControl} from './use-control';

export type TerrainControlProps = TerrainSpecification & {
  position?: ControlPosition;
  style?: JSX.CSSProperties;
};

export function TerrainControl(props: TerrainControlProps) {
  const control = useControl(
    ({mapLib}) => new mapLib.TerrainControl(props),
    {position: props.position}
  );
  createEffect(() => applyDomStyle((control as any)._container, props.style));
  return null;
}
