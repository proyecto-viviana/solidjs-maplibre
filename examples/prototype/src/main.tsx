import {createMemo, createSignal, For, onCleanup, onMount, Show} from 'solid-js';
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
import type {
  LayerProps,
  MapGeoJSONFeature,
  MapRef,
  SourceProps,
  StyleSpecification,
  ViewState
} from 'solidjs-maplibre';
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
      properties: {
        name: 'Port loop',
        kind: 'Route',
        status: 'Live',
        detail: '6 checkpoints'
      },
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
      properties: {
        name: 'Inspection grid',
        kind: 'Zone',
        status: 'Active',
        detail: '5 control edges'
      },
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

const terrainSource: SourceProps = {
  id: 'terrain-dem',
  type: 'raster-dem',
  tiles: ['/terrain-dem.png'],
  tileSize: 256,
  maxzoom: 5,
  encoding: 'mapbox'
};

const terrainSpec = {
  source: 'terrain-dem',
  exaggeration: 1.18
};

const lightSpec = {
  anchor: 'viewport',
  color: '#fff8e8',
  intensity: 0.42
} as const;

const skySpec = {
  'sky-color': '#b9d8e5',
  'sky-horizon-blend': 0.22,
  'horizon-color': '#f1c986'
};

const cameraPresets = [
  {
    id: 'harbor',
    label: 'Harbor',
    stationId: 'customs',
    camera: {
      longitude: -56.185,
      latitude: -34.924,
      zoom: 11.9,
      pitch: 38,
      bearing: -24
    }
  },
  {
    id: 'gate',
    label: 'Gate',
    stationId: 'customs',
    camera: {
      longitude: -56.193,
      latitude: -34.906,
      zoom: 13.2,
      pitch: 48,
      bearing: -18
    }
  },
  {
    id: 'yard',
    label: 'Yard',
    stationId: 'south-yard',
    camera: {
      longitude: -56.159,
      latitude: -34.936,
      zoom: 13.1,
      pitch: 44,
      bearing: 12
    }
  }
] as const;

type FeaturePick = {
  layerId: string;
  name: string;
  kind: string;
  status: string;
  detail: string;
};

function findStation(id: (typeof stations)[number]['id']) {
  return stations.find(station => station.id === id) ?? stations[0];
}

function pickFeature(feature: MapGeoJSONFeature): FeaturePick {
  return {
    layerId: feature.layer.id,
    name: String(feature.properties?.name ?? feature.layer.id),
    kind: String(feature.properties?.kind ?? 'Feature'),
    status: String(feature.properties?.status ?? 'Observed'),
    detail: String(feature.properties?.detail ?? feature.layer.id)
  };
}

function sameCamera(a: ViewState, b: ViewState) {
  return (
    Math.abs(a.longitude - b.longitude) < 0.000001 &&
    Math.abs(a.latitude - b.latitude) < 0.000001 &&
    Math.abs(a.zoom - b.zoom) < 0.000001 &&
    Math.abs(a.pitch - b.pitch) < 0.000001 &&
    Math.abs(a.bearing - b.bearing) < 0.000001 &&
    a.padding === b.padding
  );
}

function App() {
  let mapStageRef!: HTMLElement;
  let pendingCamera: ViewState | undefined;
  let cameraFrame = 0;
  const [selectedStation, setSelectedStation] = createSignal<(typeof stations)[number]>(stations[1]);
  const [showZone, setShowZone] = createSignal(true);
  const [showPopup, setShowPopup] = createSignal(true);
  const [globeProjection, setGlobeProjection] = createSignal(true);
  const [terrainEnabled, setTerrainEnabled] = createSignal(false);
  const [cursor, setCursor] = createSignal('grab');
  const [hoveredFeature, setHoveredFeature] = createSignal<FeaturePick>();
  const [pickedFeature, setPickedFeature] = createSignal<FeaturePick>(
    pickFeature({
      layer: {id: 'route-line'},
      properties: routeData.features[0].properties
    } as MapGeoJSONFeature)
  );
  const [camera, setCamera] = createSignal<ViewState>(cameraPresets[0].camera);
  const [mapSize, setMapSize] = createSignal({width: 960, height: 720});
  const controlledViewState = createMemo(() => ({
    ...camera(),
    width: mapSize().width,
    height: mapSize().height
  }));
  const interactiveLayerIds = createMemo(() =>
    showZone() ? ['route-line', 'inspection-zone'] : ['route-line']
  );

  onMount(() => {
    const updateSize = () => {
      const bounds = mapStageRef.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        const width = Math.round(bounds.width);
        const height = Math.round(bounds.height);
        setMapSize(current => {
          if (current.width === width && current.height === height) {
            return current;
          }
          return {width, height};
        });
      }
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(mapStageRef);
    onCleanup(() => {
      observer.disconnect();
      if (cameraFrame) {
        cancelAnimationFrame(cameraFrame);
      }
    });
  });

  const scheduleCameraSync = (nextCamera: ViewState) => {
    pendingCamera = nextCamera;
    if (cameraFrame) {
      return;
    }
    cameraFrame = requestAnimationFrame(() => {
      cameraFrame = 0;
      const next = pendingCamera;
      pendingCamera = undefined;
      if (!next) {
        return;
      }
      setCamera(current => {
        if (sameCamera(current, next)) {
          return current;
        }
        return next;
      });
    });
  };

  const focusStation = (station: (typeof stations)[number]) => {
    setSelectedStation(station);
    setShowPopup(true);
    setCamera(current => ({
      ...current,
      longitude: station.longitude,
      latitude: station.latitude,
      zoom: Math.max(current.zoom, 13),
      pitch: 44
    }));
  };

  const applyCameraPreset = (preset: (typeof cameraPresets)[number]) => {
    setSelectedStation(findStation(preset.stationId));
    setShowPopup(true);
    setCamera(current => ({
      ...current,
      ...preset.camera
    }));
  };

  return (
    <main class="workbench">
      <section ref={mapStageRef} class="map-stage" aria-label="MapLibre SolidJS prototype">
        <Map
          id="prototype-map"
          mapStyle={mapStyle}
          viewState={controlledViewState()}
          minZoom={9}
          maxZoom={16}
          maxPitch={72}
          projection={globeProjection() ? 'globe' : 'mercator'}
          light={lightSpec}
          sky={skySpec}
          terrain={terrainEnabled() ? terrainSpec : null}
          interactiveLayerIds={interactiveLayerIds()}
          cursor={cursor()}
          ref={map => {
            window.prototypeMap = map;
          }}
          onMouseDown={() => setCursor('grabbing')}
          onMouseUp={() => setCursor(hoveredFeature() ? 'pointer' : 'grab')}
          onMouseMove={event => {
            const feature = event.features?.[0];
            setHoveredFeature(feature ? pickFeature(feature) : undefined);
            if (cursor() !== 'grabbing') {
              setCursor(feature ? 'pointer' : 'grab');
            }
          }}
          onMouseLeave={() => {
            setHoveredFeature(undefined);
            if (cursor() !== 'grabbing') {
              setCursor('grab');
            }
          }}
          onClick={event => {
            const feature = event.features?.[0];
            if (feature) {
              setPickedFeature(pickFeature(feature));
            }
          }}
          onMove={event => {
            if (!event.originalEvent) {
              return;
            }
            scheduleCameraSync({
              longitude: event.viewState.longitude,
              latitude: event.viewState.latitude,
              zoom: event.viewState.zoom,
              pitch: event.viewState.pitch,
              bearing: event.viewState.bearing,
              padding: event.viewState.padding
            });
          }}
        >
          <NavigationControl position="top-left" />
          <FullscreenControl position="top-left" />
          <ScaleControl position="bottom-left" unit="metric" />
          <AttributionControl position="bottom-right" compact />

          <Source {...terrainSource} />

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
                  focusStation(station);
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

        <div class="feature-board">
          <div class="feature-pick">
            <span>{pickedFeature().kind}</span>
            <strong>{pickedFeature().name}</strong>
            <small>{pickedFeature().detail}</small>
          </div>
          <div class="feature-signal" classList={{live: Boolean(hoveredFeature())}}>
            <span>Hover</span>
            <strong>{hoveredFeature()?.name ?? 'Clear'}</strong>
            <small>{hoveredFeature()?.status ?? pickedFeature().layerId}</small>
          </div>
        </div>

        <div class="camera-board">
          <div class="camera-metrics">
            <span>
              Zoom <strong>{camera().zoom.toFixed(1)}</strong>
            </span>
            <span>
              Bearing <strong>{Math.round(camera().bearing)} deg</strong>
            </span>
            <span>
              Pitch <strong>{Math.round(camera().pitch)} deg</strong>
            </span>
          </div>
          <div class="camera-actions">
            <For each={cameraPresets}>
              {preset => (
                <button
                  type="button"
                  classList={{
                    active:
                      Math.abs(camera().longitude - preset.camera.longitude) < 0.001 &&
                      Math.abs(camera().latitude - preset.camera.latitude) < 0.001
                  }}
                  onClick={() => applyCameraPreset(preset)}
                >
                  {preset.label}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="surface-board">
          <div>
            <span>Projection</span>
            <strong>{globeProjection() ? 'Globe' : 'Mercator'}</strong>
          </div>
          <div>
            <span>Terrain</span>
            <strong>{terrainEnabled() ? 'DEM on' : 'Flat'}</strong>
          </div>
        </div>

        <div class="toggles">
          <label>
            <input
              type="checkbox"
              checked={globeProjection()}
              onInput={event => setGlobeProjection(event.currentTarget.checked)}
            />
            <span>Globe projection</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={terrainEnabled()}
              onInput={event => setTerrainEnabled(event.currentTarget.checked)}
            />
            <span>Terrain DEM</span>
          </label>
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
                  focusStation(station);
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
