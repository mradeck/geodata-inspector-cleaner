import type { Bounds2D, Position3 } from "../model";

export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? Number.NaN;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

export function boundsFromPoints(points: readonly Position3[]): Bounds2D | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

export function mergeBounds(bounds: readonly Bounds2D[]): Bounds2D | null {
  const first = bounds[0];
  if (!first) return null;
  return bounds.reduce<Bounds2D>(
    (result, item) => ({
      minX: Math.min(result.minX, item.minX),
      minY: Math.min(result.minY, item.minY),
      maxX: Math.max(result.maxX, item.maxX),
      maxY: Math.max(result.maxY, item.maxY),
    }),
    { ...first },
  );
}

export function boundsCenter(bounds: Bounds2D): Position3 {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    z: 0,
  };
}

export function boundsMaxExtent(bounds: Bounds2D): number {
  return Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
}

export function distance2D(a: Position3, b: Position3): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
