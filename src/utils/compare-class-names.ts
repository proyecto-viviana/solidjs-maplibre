export function compareClassNames(prevClassName?: string, nextClassName?: string): string[] | null {
  if (prevClassName === nextClassName) {
    return null;
  }

  const prev = new Set((prevClassName || '').split(/\s+/).filter(Boolean));
  const next = new Set((nextClassName || '').split(/\s+/).filter(Boolean));
  const diff: string[] = [];

  for (const className of prev) {
    if (!next.has(className)) {
      diff.push(className);
    }
  }
  for (const className of next) {
    if (!prev.has(className)) {
      diff.push(className);
    }
  }

  return diff.length > 0 ? diff : null;
}
