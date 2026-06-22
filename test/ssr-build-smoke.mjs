import {renderToString} from 'solid-js/web';
import {
  Map,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl
} from '../dist/server.js';

const emptyStyle = {version: 8, sources: {}, layers: []};

const html = renderToString(() =>
  Map({
    initialViewState: {
      longitude: -56.1645,
      latitude: -34.9011,
      zoom: 11
    },
    mapStyle: emptyStyle,
    style: {width: '100%', height: '100%'},
    children: () => [
      NavigationControl({position: 'top-right'}),
      ScaleControl({position: 'bottom-left'}),
      Marker({longitude: -56.1645, latitude: -34.9011}),
      Popup({longitude: -56.1645, latitude: -34.9011})
    ]
  })
);

if (!html.includes('<div')) {
  throw new Error(`Expected SSR map container markup, received: ${html}`);
}
