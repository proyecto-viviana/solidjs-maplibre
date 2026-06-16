import {createSignal, For, Show} from 'solid-js';
import {render} from 'solid-js/web';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AttributionControl,
  FullscreenControl,
  Layer,
  Map,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl,
  Source
} from 'solidjs-maplibre';
import type {LayerProps, MapRef, SourceProps, StyleSpecification} from 'solidjs-maplibre';
import './styles.css';

declare global {
  interface Window {
    prototypeMap?: MapRef;
  }
}

const mapStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {},
  layers: [
    {
      id: 'paper',
      type: 'background',
      paint: {
        'background-color': '#e8ece7'
      }
    }
  ]
};

type GeoJsonSourceData = Extract<SourceProps, {type: 'geojson'}>['data'];

const routeData: GeoJsonSourceData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {name: 'Port loop'},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-56.214, -34.919],
          [-56.205, -34.91],
          [-56.193, -34.906],
          [-56.178, -34.913],
          [-56.167, -34.923],
          [-56.159, -34.936]
        ]
      }
    }
  ]
};

const zoneData: GeoJsonSourceData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {name: 'Inspection grid'},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-56.222, -34.925],
            [-56.201, -34.9],
            [-56.159, -34.91],
            [-56.151, -34.943],
            [-56.19, -34.954],
            [-56.222, -34.925]
          ]
        ]
      }
    }
  ]
};

const stations = [
  {
    id: 'north-dock',
    name: 'North Dock',
    kind: 'Origin',
    longitude: -56.214,
    latitude: -34.919,
    status: 'stable'
  },
  {
    id: 'customs',
    name: 'Customs Gate',
    kind: 'Checkpoint',
    longitude: -56.193,
    latitude: -34.906,
    status: 'watch'
  },
  {
    id: 'south-yard',
    name: 'South Yard',
    kind: 'Destination',
    longitude: -56.159,
    latitude: -34.936,
    status: 'clear'
  }
] as const;

const zoneLayer: LayerProps = {
  id: 'inspection-zone',
  type: 'fill',
  paint: {
    'fill-color': '#789c7a',
    'fill-opacity': 0.22
  }
};

const zoneOutlineLayer: LayerProps = {
  id: 'inspection-zone-outline',
  type: 'line',
  paint: {
    'line-color': '#304037',
    'line-width': 2,
    'line-dasharray': [2, 2]
  }
};

const routeLayer: LayerProps = {
  id: 'route-line',
  type: 'line',
  paint: {
    'line-color': '#d44a32',
    'line-width': 5,
    'line-opacity': 0.9
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round'
  }
};

function App() {
  const [selectedStation, setSelectedStation] = createSignal<(typeof stations)[number]>(stations[1]);
  const [showZone, setShowZone] = createSignal(true);
  const [showPopup, setShowPopup] = createSignal(true);
  const [cursor, setCursor] = createSignal('grab');

  return (
    <main class="workbench">
      <section class="map-stage" aria-label="MapLibre SolidJS prototype">
        <Map
          id="prototype-map"
          mapStyle={mapStyle}
          initialViewState={{
            longitude: -56.185,
            latitude: -34.924,
            zoom: 11.9,
            pitch: 38,
            bearing: -24
          }}
          minZoom={9}
          maxZoom={16}
          cursor={cursor()}
          ref={map => {
            window.prototypeMap = map;
          }}
          onMouseDown={() => setCursor('grabbing')}
          onMouseUp={() => setCursor('grab')}
        >
          <NavigationControl position="top-left" />
          <FullscreenControl position="top-left" />
          <ScaleControl position="bottom-left" unit="metric" />
          <AttributionControl position="bottom-right" compact />

          <Show when={showZone()}>
            <Source id="zone" type="geojson" data={zoneData}>
              <Layer {...zoneLayer} />
              <Layer {...zoneOutlineLayer} />
            </Source>
          </Show>

          <Source id="route" type="geojson" data={routeData}>
            <Layer {...routeLayer} />
          </Source>

          <For each={stations}>
            {station => (
              <Marker
                longitude={station.longitude}
                latitude={station.latitude}
                anchor="center"
                className={`station-marker station-marker-${station.status}`}
                onClick={() => {
                  setSelectedStation(station);
                  setShowPopup(true);
                }}
              >
                <button class="station-pin" type="button" aria-label={station.name}>
                  <span>{station.name.slice(0, 1)}</span>
                </button>
              </Marker>
            )}
          </For>

          <Show when={showPopup()}>
            <Popup
              longitude={selectedStation().longitude}
              latitude={selectedStation().latitude}
              anchor="bottom"
              closeButton={false}
              closeOnClick={false}
              offset={24}
              maxWidth="260px"
              className="station-popup"
            >
              <article class="popup-card">
                <div>
                  <p>{selectedStation().kind}</p>
                  <h2>{selectedStation().name}</h2>
                </div>
                <button type="button" onClick={() => setShowPopup(false)} aria-label="Close station popup">
                  Close
                </button>
              </article>
            </Popup>
          </Show>
        </Map>
      </section>

      <aside class="control-panel" aria-label="Prototype controls">
        <div class="panel-head">
          <p>SolidJS MapLibre</p>
          <h1>Port Operations Prototype</h1>
        </div>

        <div class="readout">
          <span>Active station</span>
          <strong>{selectedStation().name}</strong>
          <small>{selectedStation().kind}</small>
        </div>

        <div class="toggles">
          <label>
            <input
              type="checkbox"
              checked={showZone()}
              onInput={event => setShowZone(event.currentTarget.checked)}
            />
            <span>Inspection zone</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={showPopup()}
              onInput={event => setShowPopup(event.currentTarget.checked)}
            />
            <span>Station popup</span>
          </label>
        </div>

        <div class="station-list">
          <For each={stations}>
            {station => (
              <button
                type="button"
                classList={{active: selectedStation().id === station.id}}
                onClick={() => {
                  setSelectedStation(station);
                  setShowPopup(true);
                }}
              >
                <span>{station.name}</span>
                <small>{station.status}</small>
              </button>
            )}
          </For>
        </div>
      </aside>
    </main>
  );
}

render(() => <App />, document.getElementById('root')!);
