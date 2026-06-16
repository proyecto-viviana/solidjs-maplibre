import {render, waitFor} from '@solidjs/testing-library';
import {createSignal} from 'solid-js';
import {describe, expect, it} from 'vitest';
import {Layer} from '../src/components/layer';
import {Source} from '../src/components/source';
import {MapContext} from '../src/components/use-map';
import {createFakeMapContext} from './fakes/fake-map';

const emptyFeatureCollection = {
  type: 'FeatureCollection',
  features: []
} as const;

describe('Source and Layer', () => {
  it('creates nested layers with the parent source id and cleans them up', async () => {
    const {map, context} = createFakeMapContext();
    const {unmount} = render(() => (
      <MapContext.Provider value={context}>
        <Source id="zone" type="geojson" data={emptyFeatureCollection}>
          <Layer id="zone-fill" type="fill" paint={{'fill-color': '#d94b37'}} />
        </Source>
      </MapContext.Provider>
    ));

    await waitFor(() => expect(map.getSource('zone')).toBeTruthy());
    await waitFor(() => expect(map.getLayer('zone-fill')).toMatchObject({source: 'zone'}));

    expect(map.addSource).toHaveBeenCalledWith(
      'zone',
      expect.objectContaining({type: 'geojson', data: emptyFeatureCollection})
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'zone-fill',
        type: 'fill',
        source: 'zone'
      }),
      undefined
    );

    unmount();

    expect(map.getLayer('zone-fill')).toBeUndefined();
    expect(map.getSource('zone')).toBeUndefined();
    expect(map.removeLayer).toHaveBeenCalledWith('zone-fill');
    expect(map.removeSource).toHaveBeenCalledWith('zone');
    expect(map.removeLayer.mock.invocationCallOrder[0]).toBeLessThan(
      map.removeSource.mock.invocationCallOrder[0]
    );
  });

  it('updates GeoJSON source data and layer paint properties', async () => {
    const {map, context} = createFakeMapContext();
    const nextFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {name: 'checkpoint'},
          geometry: {type: 'Point', coordinates: [0, 0]}
        }
      ]
    } as const;
    let setData!: (data: typeof emptyFeatureCollection | typeof nextFeatureCollection) => void;
    let setPaint!: (paint: {'fill-color': string}) => void;

    function Fixture() {
      const [data, updateData] = createSignal<typeof emptyFeatureCollection | typeof nextFeatureCollection>(
        emptyFeatureCollection
      );
      const [paint, updatePaint] = createSignal({'fill-color': '#d94b37'});
      setData = updateData;
      setPaint = updatePaint;

      return (
        <MapContext.Provider value={context}>
          <Source id="zone" type="geojson" data={data()}>
            <Layer id="zone-fill" type="fill" paint={paint()} />
          </Source>
        </MapContext.Provider>
      );
    }

    render(() => <Fixture />);

    await waitFor(() => expect(map.getLayer('zone-fill')).toBeTruthy());

    setData(nextFeatureCollection);
    setPaint({'fill-color': '#11261f'});

    await waitFor(() => {
      expect(map.getSource('zone')?.setData).toHaveBeenCalledWith(nextFeatureCollection);
      expect(map.setPaintProperty).toHaveBeenCalledWith('zone-fill', 'fill-color', '#11261f');
    });
  });

  it('recreates nested sources and layers after a style reload', async () => {
    const {map, context} = createFakeMapContext();
    render(() => (
      <MapContext.Provider value={context}>
        <Source id="zone" type="geojson" data={emptyFeatureCollection}>
          <Layer id="zone-fill" type="fill" paint={{'fill-color': '#d94b37'}} />
        </Source>
      </MapContext.Provider>
    ));

    await waitFor(() => expect(map.getLayer('zone-fill')).toBeTruthy());

    map.sources.clear();
    map.layers = [];
    map.fire('styledata');

    await waitFor(() => {
      expect(map.getSource('zone')).toBeTruthy();
      expect(map.getLayer('zone-fill')).toMatchObject({source: 'zone'});
    });
    expect(map.addSource).toHaveBeenCalledTimes(2);
    expect(map.addLayer).toHaveBeenCalledTimes(2);
  });
});
