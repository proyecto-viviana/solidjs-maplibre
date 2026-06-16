import {beforeEach, describe, expect, it} from 'vitest';
import Maplibre, {type MaplibreProps} from '../src/maplibre/maplibre';
import type {StyleSpecification} from '../src/types/style-spec';
import {FakeControlledMap} from './fakes/fake-controlled-map';

function createWrapper(props: MaplibreProps = {}) {
  const container = document.createElement('div');
  const wrapper = new Maplibre(FakeControlledMap as never, props, container);
  const map = FakeControlledMap.instances[FakeControlledMap.instances.length - 1]!;

  return {wrapper, map, container};
}

const emptyStyle = {
  version: 8,
  sources: {},
  layers: []
} satisfies StyleSpecification;

describe('Maplibre style updates', () => {
  beforeEach(() => {
    FakeControlledMap.instances = [];
  });

  it('updates mapStyle with diffing options', () => {
    const nextStyle: StyleSpecification = {
      version: 8,
      sources: {
        route: {
          type: 'geojson',
          data: {type: 'FeatureCollection', features: []}
        }
      },
      layers: [
        {
          id: 'route-line',
          type: 'line',
          source: 'route'
        }
      ]
    };
    const {wrapper, map} = createWrapper({mapStyle: emptyStyle});

    wrapper.setProps({
      mapStyle: nextStyle,
      styleDiffing: false,
      localIdeographFontFamily: 'Noto Sans CJK'
    });

    expect(map.setStyle).toHaveBeenCalledWith(nextStyle, {
      diff: false,
      localIdeographFontFamily: 'Noto Sans CJK'
    });
  });

  it('applies light, projection, and sky after style.load', () => {
    const light = {anchor: 'viewport', color: '#ffffff', intensity: 0.55} as const;
    const projection = {type: 'globe'} as const;
    const sky = {'sky-color': '#7aa7c7', 'sky-horizon-blend': 0.18};
    const {map} = createWrapper({light, projection, sky});

    map.fire('style.load');

    expect(map.setLight).toHaveBeenCalledWith(light);
    expect(map.setProjection).toHaveBeenCalledWith(projection);
    expect(map.setSky).toHaveBeenCalledWith(sky);
  });

  it('updates style components when props change after load', () => {
    const light = {anchor: 'map', color: '#f8f2de', intensity: 0.35} as const;
    const sky = {'sky-color': '#b9d3e4', 'sky-horizon-blend': 0.25};
    const {wrapper, map} = createWrapper({});
    map.fire('style.load');
    map.setLight.mockClear();
    map.setProjection.mockClear();
    map.setSky.mockClear();

    wrapper.setProps({light, projection: 'globe', sky});

    expect(map.setLight).toHaveBeenCalledWith(light);
    expect(map.setProjection).toHaveBeenCalledTimes(1);
    expect(map.setProjection).toHaveBeenCalledWith({type: 'globe'});
    expect(map.setSky).toHaveBeenCalledWith(sky);
  });

  it('waits for terrain source data before setting terrain and can clear terrain', () => {
    const terrain = {source: 'terrain-dem', exaggeration: 1.4};
    const {wrapper, map} = createWrapper({terrain});

    map.fire('style.load');

    expect(map.setTerrain).not.toHaveBeenCalled();

    map.sources.set('terrain-dem', {id: 'terrain-dem'});
    map.fire('sourcedata');

    expect(map.setTerrain).toHaveBeenCalledWith(terrain);

    wrapper.setProps({terrain: null});

    expect(map.setTerrain).toHaveBeenLastCalledWith(null);
  });
});
