/** HATCH boundary tags, not pattern lines or seed points.
 * Reference: Autodesk DXF Boundary Path Data (see docs/ANALYSIS-RULES.md). */
export interface Tag { code: number; value: string }
export interface Vertex { x: number; y: number; bulge: number }
export interface Boundary { vertices: Vertex[]; flags: number; approximated: boolean }
export interface HatchGeometry { boundaries: Boundary[]; elevation: number; normal: [number, number, number] }
export type HatchFailure = "invalid" | "open" | "unsupported" | "complexity";
export class HatchBoundaryError extends Error {
  constructor(readonly reason: HatchFailure) { super(reason); }
}
const TAU = Math.PI * 2;
const LIMIT = 100_000;
const fail = (reason: HatchFailure = "invalid"): never => { throw new HatchBoundaryError(reason); };
const num = (s: string): number => { const n = Number(s.trim()); return s.trim() && Number.isFinite(n) ? n : fail(); };
const vertex = (x: number, y: number, bulge = 0): Vertex => ({ x, y, bulge });
const distance = (a: Vertex, b: Vertex) => Math.hypot(a.x - b.x, a.y - b.y);
// Join only roundoff-sized discrepancies; never bridge a visibly open boundary.
function coincident(a: Vertex, b: Vertex): boolean {
  const scale = Math.max(1, Math.abs(a.x), Math.abs(a.y), Math.abs(b.x), Math.abs(b.y));
  return distance(a, b) <= Math.max(1e-9, scale * Number.EPSILON * 32);
}
class Cursor {
  i = 0;
  constructor(readonly tags: readonly Tag[]) {}
  take(code: number): number {
    const tag = this.tags[this.i++];
    return tag?.code === code ? num(tag.value) : fail();
  }
  count(code: number): number {
    const n = this.take(code);
    return Number.isInteger(n) && n >= 0 && n <= LIMIT ? n : fail("complexity");
  }
  optional(code: number, fallback: number): number { return this.tags[this.i]?.code === code ? this.take(code) : fallback; }
  point(xCode = 10): Vertex { return vertex(this.take(xCode), this.take(xCode + 10)); }
}

export function readHatchGeometry(tags: readonly Tag[], tolerance = 0.001): HatchGeometry {
  if (!(tolerance > 0 && Number.isFinite(tolerance))) fail();
  const pathStart = tags.findIndex((t) => t.code === 91);
  if (pathStart < 0) fail();
  const header = tags.slice(0, pathStart);
  const value = (code: number, fallback: number) => {
    const tag = header.find((t) => t.code === code); return tag ? num(tag.value) : fallback;
  };
  const normal: [number, number, number] = [value(210, 0), value(220, 0), value(230, 1)];
  if (Math.hypot(...normal) === 0) fail();
  const c = new Cursor(tags.slice(pathStart));
  const count = c.count(91);
  if (!count) fail();
  const boundaries: Boundary[] = [];
  let totalVertices = 0;
  for (let index = 0; index < count; index++) {
    const flags = c.count(92);
    let vertices: Vertex[] = [];
    let approximated = false;
    if (flags & 2) {
      const bulges = c.take(72); const closed = c.take(73); const n = c.count(93);
      if (![0, 1].includes(bulges) || ![0, 1].includes(closed)) fail();
      for (let v = 0; v < n; v++) {
        const p = c.point(); p.bulge = c.optional(42, 0); vertices.push(p);
      }
      if (!closed && (!vertices.length || !coincident(vertices[0]!, vertices.at(-1)!))) fail("open");
    } else {
      const n = c.count(93);
      for (let e = 0; e < n; e++) {
        const type = c.take(72);
        let segment: Vertex[] = [];
        if (type === 1) segment = [c.point(), c.point(11)];
        else if (type === 2 || type === 3) {
          const center = c.point();
          const axis = type === 3 ? c.point(11) : vertex(1, 0);
          const radiusOrRatio = c.take(40);
          let start = c.take(50) * Math.PI / 180; let end = c.take(51) * Math.PI / 180;
          const ccw = c.take(73);
          if (radiusOrRatio <= 0 || ![0, 1].includes(ccw) || (type === 3 && (!distance(axis, vertex(0, 0)) || radiusOrRatio > 1))) fail();
          // Clockwise DXF angles are complementary; convert before reversing traversal.
          if (!ccw) [start, end] = [TAU - end, TAU - start];
          let sweep = ((end - start) % TAU + TAU) % TAU;
          if (Math.abs(sweep) < 1e-12) sweep = TAU;
          if (type === 2) {
            const n = Math.max(1, Math.ceil(sweep / Math.PI));
            segment = Array.from({ length: n + 1 }, (_, i) => {
              const a = start + sweep * i / n;
              return vertex(center.x + radiusOrRatio * Math.cos(a), center.y + radiusOrRatio * Math.sin(a), i < n ? Math.tan(sweep / n / 4) : 0);
            });
          } else {
            // HATCH ellipse angles are geometric polar angles, not parameters.
            const parameter = (angle: number) => Math.atan2(Math.sin(angle) / radiusOrRatio, Math.cos(angle));
            const p0 = parameter(start); let span = ((parameter(end) - p0) % TAU + TAU) % TAU;
            if (sweep >= TAU - 1e-12) span = TAU;
            const major = Math.hypot(axis.x, axis.y);
            const step = Math.min(Math.PI / 18, Math.sqrt(8 * tolerance / major));
            const pieces = Math.ceil(span / step);
            if (pieces > LIMIT) fail("complexity");
            segment = Array.from({ length: pieces + 1 }, (_, i) => {
              const a = p0 + span * i / pieces;
              return vertex(center.x + axis.x * Math.cos(a) - axis.y * radiusOrRatio * Math.sin(a), center.y + axis.y * Math.cos(a) + axis.x * radiusOrRatio * Math.sin(a));
            });
            approximated = true;
          }
          if (!ccw) segment = reverseSegment(segment);
        } else if (type === 4) {
          segment = readSpline(c, tolerance); approximated = true;
        } else fail("unsupported");
        if (vertices.length) {
          const last = vertices.at(-1)!;
          if (!coincident(last, segment[0]!)) {
            if (coincident(last, segment.at(-1)!)) segment = reverseSegment(segment);
            else fail("open");
          }
          vertices.pop();
        }
        vertices.push(...segment);
        if (vertices.length > LIMIT) fail("complexity");
      }
      if (!vertices.length || !coincident(vertices[0]!, vertices.at(-1)!)) fail("open");
    }
    if (vertices.length > 1 && coincident(vertices[0]!, vertices.at(-1)!)) vertices.pop();
    if (vertices.length < 2 || (vertices.length < 3 && vertices.every((v) => v.bulge === 0))) fail();
    if (!vertices.every((v) => [v.x, v.y, v.bulge].every(Number.isFinite))) fail();
    totalVertices += vertices.length; if (totalVertices > LIMIT) fail("complexity");
    const references = c.count(97);
    for (let r = 0; r < references; r++) { if (c.tags[c.i++]?.code !== 330) fail(); }
    boundaries.push({ vertices, flags, approximated });
  }
  return { boundaries, elevation: value(30, 0), normal };
}

function reverseSegment(points: Vertex[]): Vertex[] {
  return points.map((_, i) => {
    const source = points[points.length - 1 - i]!;
    return vertex(source.x, source.y, i < points.length - 1 ? -points[points.length - 2 - i]!.bulge : 0);
  });
}

function readSpline(c: Cursor, tolerance: number): Vertex[] {
  const degree = c.count(94); const rational = c.take(73); c.take(74);
  const knotCount = c.count(95); const controlCount = c.count(96);
  if (degree < 1 || degree > 16 || controlCount <= degree || knotCount !== controlCount + degree + 1 || ![0, 1].includes(rational)) fail("unsupported");
  const knots = Array.from({ length: knotCount }, () => c.take(40));
  if (knots.some((v, i) => i > 0 && v < knots[i - 1]!)) fail();
  const weights: number[] = [];
  const controls = Array.from({ length: controlCount }, () => {
    const point = c.point(); weights.push(c.optional(42, 1)); return point;
  });
  if (weights.some((w) => w <= 0)) fail();
  const fitCount = c.count(97);
  for (let i = 0; i < fitCount; i++) c.point(11);
  if (c.tags[c.i]?.code === 12) c.point(12);
  if (c.tags[c.i]?.code === 13) c.point(13);
  const evaluate = (u: number): Vertex => {
    let span = degree;
    while (span < controlCount - 1 && knots[span + 1]! <= u) span++;
    const work = Array.from({ length: degree + 1 }, (_, j) => {
      const index = span - degree + j; const p = controls[index]!; const w = weights[index]!;
      return [p.x * w, p.y * w, w];
    });
    for (let r = 1; r <= degree; r++) for (let j = degree; j >= r; j--) {
      const index = span - degree + j;
      const denominator = knots[index + degree - r + 1]! - knots[index]!;
      const alpha = denominator ? (u - knots[index]!) / denominator : 0;
      for (let k = 0; k < 3; k++) work[j]![k] = (1 - alpha) * work[j - 1]![k]! + alpha * work[j]![k]!;
    }
    const p = work[degree]!; return vertex(p[0]! / p[2]!, p[1]! / p[2]!);
  };
  const points: Vertex[] = [];
  const subdivide = (a: number, b: number, pa: Vertex, pb: Vertex, depth: number): void => {
    if (points.length > LIMIT || depth > 20) fail("complexity");
    const mid = evaluate((a + b) / 2);
    const deviation = Math.max(...[0.25, 0.5, 0.75].map((f) => {
      const p = evaluate(a + (b - a) * f); return distance(p, vertex(pa.x + (pb.x - pa.x) * f, pa.y + (pb.y - pa.y) * f));
    }));
    if (deviation <= tolerance && depth >= 2) { points.push(pa); return; }
    subdivide(a, (a + b) / 2, pa, mid, depth + 1); subdivide((a + b) / 2, b, mid, pb, depth + 1);
  };
  for (let i = degree; i < controlCount; i++) {
    const a = knots[i]!; const b = knots[i + 1]!;
    if (b > a) subdivide(a, b, evaluate(a), evaluate(b), 0);
  }
  points.push(evaluate(knots[controlCount]!));
  return points;
}

/** AutoCAD arbitrary-axis algorithm for OCS coordinates (kept native in export). */
export function toWorld(p: Vertex, elevation: number, normal: [number, number, number]) {
  const length = Math.hypot(...normal); const n = normal.map((v) => v / length);
  let ax = Math.abs(n[0]!) < 1 / 64 && Math.abs(n[1]!) < 1 / 64 ? [n[2]!, 0, -n[0]!] : [-n[1]!, n[0]!, 0];
  const axLength = Math.hypot(...ax); ax = ax.map((v) => v / axLength);
  const ay = [n[1]! * ax[2]! - n[2]! * ax[1]!, n[2]! * ax[0]! - n[0]! * ax[2]!, n[0]! * ax[1]! - n[1]! * ax[0]!];
  const v = [0, 1, 2].map((i) => ax[i]! * p.x + ay[i]! * p.y + n[i]! * elevation);
  return { x: v[0]!, y: v[1]!, z: v[2]! };
}

/** Rendering approximation only; the DXF writer retains circular arcs as bulges. */
export function sampleVertices(vertices: Vertex[], closed: boolean): Vertex[] {
  const result: Vertex[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!; const b = vertices[(i + 1) % vertices.length]!;
    result.push(a);
    if (!a.bulge || (!closed && i === vertices.length - 1)) continue;
    const dx = b.x - a.x; const dy = b.y - a.y;
    const f = (1 - a.bulge * a.bulge) / (4 * a.bulge);
    const cx = (a.x + b.x) / 2 - dy * f; const cy = (a.y + b.y) / 2 + dx * f;
    const radius = Math.hypot(a.x - cx, a.y - cy);
    const start = Math.atan2(a.y - cy, a.x - cx); const sweep = 4 * Math.atan(a.bulge);
    const n = Math.min(144, Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 36))));
    for (let j = 1; j < n; j++) result.push(vertex(cx + radius * Math.cos(start + sweep * j / n), cy + radius * Math.sin(start + sweep * j / n)));
    if (result.length > LIMIT) fail("complexity");
  }
  return result;
}
