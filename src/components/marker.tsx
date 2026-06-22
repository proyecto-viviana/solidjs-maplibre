import {Show, createEffect, createMemo, JSX, onCleanup, onMount, splitProps, useContext} from 'solid-js';
import {Portal, isServer} from 'solid-js/web';
import type {MarkerEvent, MarkerDragEvent} from '../types/events';
import type {MarkerInstance, MarkerOptions, PopupInstance} from '../types/lib';
import {applyDomStyle} from '../utils/apply-dom-style';
import {arePointsEqual} from '../utils/deep-equal';
import {compareClassNames} from '../utils/compare-class-names';
import {MapContext} from './use-map';

export type MarkerProps = MarkerOptions & {
  longitude: number;
  latitude: number;
  popup?: PopupInstance | null;
  style?: JSX.CSSProperties;
  ref?: (marker: MarkerInstance) => void;
  onClick?: (event: MarkerEvent<MouseEvent>) => void;
  onDragStart?: (event: MarkerDragEvent) => void;
  onDrag?: (event: MarkerDragEvent) => void;
  onDragEnd?: (event: MarkerDragEvent) => void;
  children?: JSX.Element;
};

export function Marker(props: MarkerProps) {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('<Marker> must be used inside a <Map>');
  }
  if (isServer) {
    return null;
  }

  let previousProps: MarkerProps = {...props};
  const element = createMemo(() => document.createElement('div'))();
  const marker = createMemo<MarkerInstance>(() => {
    const [, options] = splitProps(props, [
      'longitude',
      'latitude',
      'popup',
      'style',
      'ref',
      'onClick',
      'onDragStart',
      'onDrag',
      'onDragEnd',
      'children'
    ]);
    const instance = new context.mapLib.Marker({
      ...options,
      element
    });
    instance.setLngLat([props.longitude, props.latitude]);
    return instance;
  })();

  const handleClick = (originalEvent: MouseEvent) => {
    props.onClick?.({
      type: 'click',
      target: marker,
      originalEvent
    });
  };

  onMount(() => {
    const map = context.map.getMap();
    const onDragStart = (event: unknown) => {
      const markerEvent = event as MarkerDragEvent;
      markerEvent.lngLat = marker.getLngLat();
      props.onDragStart?.(markerEvent);
    };
    const onDrag = (event: unknown) => {
      const markerEvent = event as MarkerDragEvent;
      markerEvent.lngLat = marker.getLngLat();
      props.onDrag?.(markerEvent);
    };
    const onDragEnd = (event: unknown) => {
      const markerEvent = event as MarkerDragEvent;
      markerEvent.lngLat = marker.getLngLat();
      props.onDragEnd?.(markerEvent);
    };

    marker.getElement().addEventListener('click', handleClick);
    marker.on('dragstart', onDragStart);
    marker.on('drag', onDrag);
    marker.on('dragend', onDragEnd);
    marker.addTo(map);
    props.ref?.(marker);

    onCleanup(() => {
      marker.getElement().removeEventListener('click', handleClick);
      marker.off('dragstart', onDragStart);
      marker.off('drag', onDrag);
      marker.off('dragend', onDragEnd);
      marker.remove();
    });
  });

  createEffect(() => {
    const {
      longitude,
      latitude,
      offset,
      style,
      draggable = false,
      popup = null,
      rotation = 0,
      rotationAlignment = 'auto',
      pitchAlignment = 'auto'
    } = props;

    const lngLat = marker.getLngLat();
    if (lngLat.lng !== longitude || lngLat.lat !== latitude) {
      marker.setLngLat([longitude, latitude]);
    }
    if (offset && !arePointsEqual(marker.getOffset(), offset)) {
      marker.setOffset(offset);
    }
    if (marker.isDraggable() !== draggable) {
      marker.setDraggable(draggable);
    }
    if (marker.getRotation() !== rotation) {
      marker.setRotation(rotation);
    }
    if (marker.getRotationAlignment() !== rotationAlignment) {
      marker.setRotationAlignment(rotationAlignment);
    }
    if (marker.getPitchAlignment() !== pitchAlignment) {
      marker.setPitchAlignment(pitchAlignment);
    }
    if (marker.getPopup() !== popup) {
      marker.setPopup(popup);
    }

    const classNameDiff = compareClassNames(previousProps.className, props.className);
    if (classNameDiff) {
      for (const className of classNameDiff) {
        marker.toggleClassName(className);
      }
    }

    applyDomStyle(marker.getElement(), style);
    previousProps = {...props};
  });

  return (
    <Show when={element}>
      <Portal mount={element}>{props.children}</Portal>
    </Show>
  );
}
