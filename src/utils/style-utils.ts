import type {ImmutableLike} from '../types/common';
import type {StyleSpecification} from '../types/style-spec';

const refProps = ['type', 'source', 'source-layer', 'minzoom', 'maxzoom', 'filter', 'layout'];

export function normalizeStyle(
  style: string | StyleSpecification | ImmutableLike<StyleSpecification> | null | undefined
): string | StyleSpecification | null {
  if (!style) {
    return null;
  }
  if (typeof style === 'string') {
    return style;
  }

  let styleObject: StyleSpecification = 'toJS' in style ? style.toJS() : style;
  if (!styleObject.layers) {
    return styleObject;
  }

  const layerIndex: Record<string, StyleSpecification['layers'][number]> = {};
  for (const layer of styleObject.layers) {
    layerIndex[layer.id] = layer;
  }

  const layers = styleObject.layers.map(layer => {
    let normalizedLayer: typeof layer | null = null;

    if ('interactive' in layer) {
      normalizedLayer = {...layer};
      delete (normalizedLayer as Record<string, unknown>).interactive;
    }

    const layerRef = layerIndex[(layer as unknown as Record<string, string>).ref];
    if (layerRef) {
      normalizedLayer = normalizedLayer || {...layer};
      delete (normalizedLayer as Record<string, unknown>).ref;
      for (const propName of refProps) {
        if (propName in layerRef) {
          (normalizedLayer as Record<string, unknown>)[propName] = (
            layerRef as Record<string, unknown>
          )[propName];
        }
      }
    }

    return normalizedLayer || layer;
  });

  return {...styleObject, layers};
}
