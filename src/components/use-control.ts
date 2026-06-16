import {createMemo, onCleanup, onMount, useContext} from 'solid-js';
import type {ControlPosition, IControl} from '../types/lib';
import {MapContext} from './use-map';
import type {CurrentMapContextValue} from './use-map';

type ControlOptions = {
  position?: ControlPosition;
};

export function useControl<T extends IControl>(
  onCreate: (context: CurrentMapContextValue) => T,
  opts?: ControlOptions
): T;

export function useControl<T extends IControl>(
  onCreate: (context: CurrentMapContextValue) => T,
  onRemove: (context: CurrentMapContextValue) => void,
  opts?: ControlOptions
): T;

export function useControl<T extends IControl>(
  onCreate: (context: CurrentMapContextValue) => T,
  onAdd: (context: CurrentMapContextValue) => void,
  onRemove: (context: CurrentMapContextValue) => void,
  opts?: ControlOptions
): T;

export function useControl<T extends IControl>(
  onCreate: (context: CurrentMapContextValue) => T,
  arg1?: ((context: CurrentMapContextValue) => void) | ControlOptions,
  arg2?: ((context: CurrentMapContextValue) => void) | ControlOptions,
  arg3?: ControlOptions
): T {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useControl must be used inside a <Map>');
  }

  const control = createMemo(() => onCreate(context))();

  onMount(() => {
    const opts = (arg3 || arg2 || arg1) as ControlOptions | undefined;
    const onAdd = typeof arg1 === 'function' && typeof arg2 === 'function' ? arg1 : undefined;
    const onRemove =
      typeof arg2 === 'function' ? arg2 : typeof arg1 === 'function' ? arg1 : undefined;

    const {map} = context;
    if (!map.hasControl(control)) {
      map.addControl(control, opts?.position);
      onAdd?.(context);
    }

    onCleanup(() => {
      onRemove?.(context);
      if (map.hasControl(control)) {
        map.removeControl(control);
      }
    });
  });

  return control;
}
