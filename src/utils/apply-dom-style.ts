import type {JSX} from 'solid-js';

const unitlessNumber = /box|flex|grid|column|lineHeight|fontWeight|opacity|order|tabSize|zIndex/;

export function applyDomStyle(element: HTMLElement | undefined, styles: JSX.CSSProperties | undefined) {
  if (!element || !styles) {
    return;
  }

  const style = element.style as unknown as Record<string, string>;
  for (const key in styles) {
    const value = styles[key as keyof JSX.CSSProperties];
    if (Number.isFinite(value) && !unitlessNumber.test(key)) {
      style[key] = `${value}px`;
    } else if (value === undefined || value === null) {
      style[key] = '';
    } else {
      style[key] = String(value);
    }
  }
}
