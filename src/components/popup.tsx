import {Show, createEffect, createMemo, JSX, onCleanup, onMount, splitProps, useContext} from 'solid-js';
import {Portal, isServer} from 'solid-js/web';
import type {PopupEvent} from '../types/events';
import type {PopupInstance, PopupOptions} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {compareClassNames} from '../utils/compare-class-names';
import {deepEqual} from '../utils/deep-equal';
import {MapContext} from './use-map';

export type PopupProps = PopupOptions & {
  longitude: number;
  latitude: number;
  style?: JSX.CSSProperties;
  ref?: (popup: PopupInstance) => void;
  onOpen?: (event: PopupEvent) => void;
  onClose?: (event: PopupEvent) => void;
  children?: JSX.Element;
};

export function Popup(props: PopupProps) {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('<Popup> must be used inside a <Map>');
  }
  if (isServer) {
    return null;
  }

  let previousProps: PopupProps = {...props};
  const container = createMemo(() => document.createElement('div'))();
  const popup = createMemo<PopupInstance>(() => {
    const [, options] = splitProps(props, [
      'longitude',
      'latitude',
      'style',
      'ref',
      'onOpen',
      'onClose',
      'children'
    ]);
    const instance = new context.mapLib.Popup(options);
    instance.setLngLat([props.longitude, props.latitude]);
    instance.once('open', event => props.onOpen?.(event as PopupEvent));
    return instance;
  })();

  onMount(() => {
    const onClose = (event: unknown) => props.onClose?.(event as PopupEvent);
    popup.on('close', onClose);
    popup.setDOMContent(container).addTo(context.map.getMap());
    props.ref?.(popup);

    onCleanup(() => {
      popup.off('close', onClose);
      if (popup.isOpen()) {
        popup.remove();
      }
    });
  });

  createEffect(() => {
    if (popup.isOpen()) {
      const lngLat = popup.getLngLat();
      if (lngLat.lng !== props.longitude || lngLat.lat !== props.latitude) {
        popup.setLngLat([props.longitude, props.latitude]);
      }
      if (props.offset && !deepEqual(previousProps.offset, props.offset)) {
        popup.setOffset(props.offset);
      }
      if (previousProps.anchor !== props.anchor || previousProps.maxWidth !== props.maxWidth) {
        popup.options.anchor = props.anchor;
        popup.setMaxWidth(props.maxWidth || '240px');
      }
      const classNameDiff = compareClassNames(previousProps.className, props.className);
      if (classNameDiff) {
        for (const className of classNameDiff) {
          popup.toggleClassName(className);
        }
      }
    }

    applyDomStyle(popup.getElement(), props.style);
    previousProps = {...props};
  });

  return (
    <Show when={container}>
      <Portal mount={container}>{props.children}</Portal>
    </Show>
  );
}
