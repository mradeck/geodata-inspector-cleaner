import { inspectDxfDuplicates, type DxfDuplicateCheck, type DxfSourceEntity } from "../duplicates/dxfDuplicates";
import { HatchBoundaryError, readHatchGeometry, type Boundary, type HatchFailure, type HatchGeometry, type Tag } from "./hatchBoundaries";

export interface HatchOutline {
  sourceId: string;
  sourceHandle: string | null;
  layer: string;
  pathIndex: number;
  boundary: Boundary;
  elevation: number;
  normal: [number, number, number];
  owner: string | null;
  paper: string | null;
  layout: string | null;
  exists: boolean;
}
export interface HatchOutlineCheck {
  hatchCount: number;
  outlines: HatchOutline[];
  skipped: Array<{ handle: string | null; layer: string; reason: HatchFailure }>;
  error: "structure" | "encoding" | "version" | null;
}
function value(tags: readonly Tag[], code: number): string | null { return tags.find((t) => t.code === code)?.value.trim() ?? null; }

/** Exclude reactor/dictionary 330 references; use only the entity's owner. */
function ownerOf(entity: DxfSourceEntity): string | null {
  let depth = 0;
  for (const tag of entity.tags) {
    if (tag.code === 102) { if (tag.value.startsWith("{")) depth++; else if (tag.value === "}") depth--; }
    if (!depth && tag.code === 330) return tag.value.trim();
    if (tag.code === 100 && tag.value.trim() === "AcDbEntity") break;
  }
  return null;
}
function outlineKey(o: Pick<HatchOutline, "layer" | "owner" | "paper" | "layout" | "elevation" | "normal" | "boundary">): string {
  return JSON.stringify([o.layer, o.owner, o.paper ?? "0", o.layout, o.elevation, o.normal,
    o.boundary.vertices.map((v) => [v.x, v.y, v.bulge])]);
}
function existingKey(entity: DxfSourceEntity): string | null {
  if (entity.type !== "LWPOLYLINE" || !(Number(value(entity.tags, 70)) & 1)) return null;
  const vertices: Boundary["vertices"] = [];
  for (const t of entity.tags) {
    if (t.code === 10) vertices.push({ x: Number(t.value), y: NaN, bulge: 0 });
    else if (t.code === 20 && vertices.length) vertices.at(-1)!.y = Number(t.value);
    else if (t.code === 42 && vertices.length) vertices.at(-1)!.bulge = Number(t.value);
  }
  return outlineKey({ layer: entity.layer, owner: ownerOf(entity), paper: value(entity.tags, 67), layout: value(entity.tags, 410),
    elevation: Number(value(entity.tags, 38) ?? 0), normal: [Number(value(entity.tags, 210) ?? 0), Number(value(entity.tags, 220) ?? 0), Number(value(entity.tags, 230) ?? 1)],
    boundary: { vertices, flags: 0, approximated: false } });
}
export function inspectHatchOutlines(source: DxfDuplicateCheck, tolerance = 0.001): HatchOutlineCheck {
  const hatches = source.entities.filter((e) => e.type === "HATCH");
  const result: HatchOutlineCheck = { hatchCount: hatches.length, outlines: [], skipped: [], error: source.error };
  const version = source.source.match(/\$ACADVER\s*[\r\n]+\s*1\s*[\r\n]+(AC\d+)/)?.[1];
  if (version && Number(version.slice(2)) < 1014) result.error = "version";
  if (result.error) return result;
  const existing = new Set(source.entities.map(existingKey).filter((v): v is string => v !== null));
  for (const entity of hatches) {
    let geometry: HatchGeometry;
    try { geometry = readHatchGeometry(entity.tags, tolerance); }
    catch (error) {
      result.skipped.push({ handle: entity.handle, layer: entity.layer, reason: error instanceof HatchBoundaryError ? error.reason : "invalid" });
      continue;
    }
    geometry.boundaries.forEach((boundary, pathIndex) => {
      const o: HatchOutline = { sourceId: entity.id, sourceHandle: entity.handle, layer: entity.layer, pathIndex,
        boundary, elevation: geometry.elevation, normal: geometry.normal, owner: ownerOf(entity),
        paper: value(entity.tags, 67), layout: value(entity.tags, 410), exists: false };
      const key = outlineKey(o); o.exists = existing.has(key); existing.add(key); result.outlines.push(o);
    });
  }
  return result;
}

/** Append outlines to the original DXF. Never reconstruct/normalize existing CAD objects. */
export function createHatchOutlineExport(source: DxfDuplicateCheck, tolerance = 0.001) {
  const check = inspectHatchOutlines(source, tolerance);
  const outlines = check.outlines.filter((o) => !o.exists);
  if (check.error || !outlines.length) throw new Error("no-outlines");
  const lines = [...source.source.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)].filter((m) => m[0].length);
  let highest = 0n; let seed: { start: number; end: number } | null = null;
  for (let i = 0; i < lines.length; i += 2) {
    const code = Number(lines[i]![0].trim()); const val = lines[i + 1]![0].trim();
    if ((code === 5 || code === 105) && /^[0-9a-f]+$/i.test(val)) {
      const handle = BigInt(`0x${val}`); if (handle > highest) highest = handle;
    }
    if (code === 9 && val === "$HANDSEED" && lines[i + 2]?.[0].trim() === "5") {
      seed = { start: lines[i + 3]!.index!, end: lines[i + 3]!.index! + lines[i + 3]![0].length };
    }
  }
  let counter = highest + 1n;
  const newline = source.source.match(/\r\n|\n|\r/)?.[0] ?? "\n";
  const additions: string[] = [];
  const created = outlines.map((o) => {
    const handle = (counter++).toString(16).toUpperCase();
    const tags: Array<[number, string | number]> = [[0, "LWPOLYLINE"], [5, handle]];
    if (o.owner) tags.push([330, o.owner]);
    tags.push([100, "AcDbEntity"]);
    if (o.paper !== null) tags.push([67, o.paper]);
    tags.push([8, o.layer]);
    if (o.layout !== null) tags.push([410, o.layout]);
    tags.push([100, "AcDbPolyline"], [90, o.boundary.vertices.length], [70, 1], [38, o.elevation]);
    for (const v of o.boundary.vertices) { tags.push([10, v.x], [20, v.y]); if (v.bulge) tags.push([42, v.bulge]); }
    tags.push([210, o.normal[0]], [220, o.normal[1]], [230, o.normal[2]]);
    additions.push(tags.flatMap(([c, v]) => [c, v]).join(newline) + newline);
    return { handle, sourceHandle: o.sourceHandle, layer: o.layer, path: o.pathIndex + 1, vertices: o.boundary.vertices.length, approximated: o.boundary.approximated };
  });
  const insertion = source.entities.at(-1)!.end;
  const edits = [{ start: insertion, end: insertion, content: additions.join("") }];
  if (seed) edits.push({ ...seed, content: counter.toString(16).toUpperCase() + newline });
  edits.sort((a, b) => b.start - a.start);
  let content = source.source;
  for (const e of edits) content = content.slice(0, e.start) + e.content + content.slice(e.end);
  const reparsed = inspectDxfDuplicates(content);
  if (reparsed.error || reparsed.entities.length !== source.entities.length + created.length) throw new Error("validation");
  for (let i = 0; i < source.entities.length; i++) {
    const before = source.entities[i]!; const after = reparsed.entities[i]!;
    if (source.source.slice(before.start, before.end) !== content.slice(after.start, after.end)) throw new Error("validation");
  }
  const generated = reparsed.entities.slice(source.entities.length);
  if (generated.some((e, i) => existingKey(e) !== outlineKey(outlines[i]!))) throw new Error("validation");
  return { content, created, skipped: check.skipped, existingCount: check.outlines.filter((o) => o.exists).length, hatchCount: check.hatchCount };
}
