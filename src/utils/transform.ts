import type {ViewState} from '../types/common';
import type {TransformLike} from '../types/internal';
import type {MaplibreProps} from '../maplibre/maplibre';
import {deepEqual} from './deep-equal';

export function transformToViewState(tr: TransformLike): ViewState {
  return {
    longitude: tr.center.lng,
    latitude: tr.center.lat,
    zoom: tr.zoom,
    pitch: tr.pitch,
    bearing: tr.bearing,
    padding: tr.padding
  };
}

export function applyViewStateToTransform(
  tr: TransformLike,
  props: MaplibreProps
): Partial<TransformLike> {
  const viewState = props.viewState || props;
  const changes: Partial<TransformLike> = {};

  if (
    'longitude' in viewState &&
    'latitude' in viewState &&
    (viewState.longitude !== tr.center.lng || viewState.latitude !== tr.center.lat)
  ) {
    const LngLat = tr.center.constructor;
    changes.center = new LngLat(viewState.longitude, viewState.latitude);
  }
  if ('zoom' in viewState && viewState.zoom !== tr.zoom) {
    changes.zoom = viewState.zoom;
  }
  if ('bearing' in viewState && viewState.bearing !== tr.bearing) {
    changes.bearing = viewState.bearing;
  }
  if ('pitch' in viewState && viewState.pitch !== tr.pitch) {
    changes.pitch = viewState.pitch;
  }
  if (viewState.padding && tr.padding && !deepEqual(viewState.padding, tr.padding)) {
    changes.padding = viewState.padding;
  }
  return changes;
}
