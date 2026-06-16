import {describe, expect, it} from 'vitest';
import createRef from '../src/maplibre/create-ref';

class FakeMap {
  getSelf() {
    return this;
  }

  getZoom() {
    return 12;
  }

  addLayer() {
    return 'blocked';
  }

  remove() {
    return 'blocked';
  }

  fire() {
    return 'blocked';
  }

  setEventedParent() {
    return 'blocked';
  }
}

describe('createRef', () => {
  it('exposes safe map methods bound to the map instance', () => {
    const map = new FakeMap();
    const ref = createRef({map} as any);

    expect(ref?.getMap()).toBe(map);
    expect(ref?.getZoom()).toBe(12);
    expect(ref?.getSelf()).toBe(map);
  });

  it('does not expose mutating or internal MapLibre methods', () => {
    const map = new FakeMap();
    const ref = createRef({map} as any) as Record<string, unknown>;

    expect(ref.addLayer).toBeUndefined();
    expect(ref.remove).toBeUndefined();
    expect(ref.fire).toBeUndefined();
    expect(ref.setEventedParent).toBeUndefined();
  });
});
