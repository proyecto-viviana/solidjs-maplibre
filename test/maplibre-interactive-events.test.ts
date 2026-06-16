import {beforeEach, describe, expect, it, vi} from 'vitest';
import Maplibre from '../src/maplibre/maplibre';
import {FakeControlledMap} from './fakes/fake-controlled-map';

function createWrapper(props: Record<string, any> = {}) {
  const container = document.createElement('div');
  const wrapper = new Maplibre(FakeControlledMap as never, props, container);
  const map = FakeControlledMap.instances[FakeControlledMap.instances.length - 1]!;

  return {wrapper, map, container};
}

function createFeature(layerId: string, name: string) {
  return {
    type: 'Feature',
    layer: {id: layerId},
    properties: {name},
    geometry: {type: 'Point', coordinates: [0, 0]}
  };
}

describe('Maplibre interactive layer events', () => {
  beforeEach(() => {
    FakeControlledMap.instances = [];
  });

  it('queries only mounted interactive layers and attaches features to click events', () => {
    const clickedEvents: Array<{type: string; features?: Record<string, unknown>[]}> = [];
    const routeFeature = createFeature('route-line', 'Port loop');
    const onClick = vi.fn(event => {
      clickedEvents.push({type: event.type, features: event.features});
    });
    const {map} = createWrapper({
      interactiveLayerIds: ['route-line', 'missing-layer'],
      onClick
    });
    map.layers.set('route-line', {id: 'route-line'});
    map.queryResult = [routeFeature];

    map.fire('click', {point: {x: 10, y: 20}});

    expect(map.queryRenderedFeatures).toHaveBeenCalledWith(
      {x: 10, y: 20},
      {layers: ['route-line']}
    );
    expect(clickedEvents).toEqual([{type: 'click', features: [routeFeature]}]);
  });

  it('attaches features to mousemove events over interactive layers', () => {
    const movedEvents: Array<{type: string; features?: Record<string, unknown>[]}> = [];
    const routeFeature = createFeature('route-line', 'Port loop');
    const onMouseMove = vi.fn(event => {
      movedEvents.push({type: event.type, features: event.features});
    });
    const {map} = createWrapper({
      interactiveLayerIds: ['route-line'],
      onMouseMove
    });
    map.layers.set('route-line', {id: 'route-line'});
    map.queryResult = [routeFeature];

    map.fire('mousemove', {point: {x: 8, y: 16}});

    expect(movedEvents).toEqual([{type: 'mousemove', features: [routeFeature]}]);
  });

  it('synthesizes mouseenter and mouseleave as hovered features change', () => {
    const enteredEvents: Array<{type: string; features?: Record<string, unknown>[]}> = [];
    const leftEvents: Array<{type: string; features?: Record<string, unknown>[]}> = [];
    const movedEvents: Array<{type: string; features?: Record<string, unknown>[]}> = [];
    const routeFeature = createFeature('route-line', 'Port loop');
    const onMouseEnter = vi.fn(event => {
      enteredEvents.push({type: event.type, features: event.features});
    });
    const onMouseLeave = vi.fn(event => {
      leftEvents.push({type: event.type, features: event.features});
    });
    const onMouseMove = vi.fn(event => {
      movedEvents.push({type: event.type, features: event.features});
    });
    const {map} = createWrapper({
      interactiveLayerIds: ['route-line'],
      onMouseEnter,
      onMouseLeave,
      onMouseMove
    });
    map.layers.set('route-line', {id: 'route-line'});

    map.queryResult = [routeFeature];
    map.fire('mousemove', {point: {x: 1, y: 2}});
    map.queryResult = [];
    map.fire('mousemove', {point: {x: 100, y: 200}});

    expect(enteredEvents).toEqual([{type: 'mouseenter', features: [routeFeature]}]);
    expect(leftEvents).toEqual([{type: 'mouseleave', features: [routeFeature]}]);
    expect(movedEvents).toEqual([
      {type: 'mousemove', features: [routeFeature]},
      {type: 'mousemove', features: []}
    ]);
  });
});
