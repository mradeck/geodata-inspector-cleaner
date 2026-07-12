import type { GeoDataset, GeoFeature, GeoLayerMetadata, GeometryKind, ImportWarning, Position3 } from "../model";

interface DxfGroup {
  code: number;
  value: string;
}

interface ParseState {
  features: GeoFeature[];
  skipped: Map<string, number>;
  approximated: Map<string, number>;
  invalid: number;
  nextId: number;
}

const STRUCTURAL_MARKERS = new Set(["SECTION", "ENDSEC", "EOF", "TABLE", "ENDTAB", "BLOCK", "ENDBLK", "SEQEND"]);

export function parseDxf(text: string, fileName: string): GeoDataset {
  if (/AutoCAD Binary DXF/i.test(text.slice(0, 64))) {
    throw new Error("Binäre DXF-Dateien werden im Prototyp noch nicht unterstützt.");
  }
  const groups = parseGroups(text);
  if (groups.length === 0) throw new Error("Die Datei enthält keine lesbaren DXF-Gruppen.");
  const state: ParseState = { features: [], skipped: new Map(), approximated: new Map(), invalid: 0, nextId: 1 };
  const entityRange = findEntitiesRange(groups);
  if (!entityRange) throw new Error("Die DXF-Datei enthält keine ENTITIES-Sektion.");

  let index = entityRange.start;
  while (index < entityRange.end) {
    const marker = groups[index];
    if (!marker || marker.code !== 0) {
      index++;
      continue;
    }
    const type = marker.value.toUpperCase();
    if (type === "POLYLINE") {
      index = parseClassicPolyline(groups, index, entityRange.end, state);
      continue;
    }
    const next = findNextMarker(groups, index + 1, entityRange.end);
    if (!STRUCTURAL_MARKERS.has(type)) parseEntity(type, groups.slice(index + 1, next), state);
    index = next;
  }

  const warnings: ImportWarning[] = [];
  for (const [type, count] of state.skipped) {
    warnings.push({ code: `dxf.skipped.${type}`, message: `DXF-Entität ${type} ohne auswertbare Geometrie übersprungen`, count });
  }
  for (const [type, count] of state.approximated) {
    warnings.push({ code: `dxf.approximated.${type}`, message: `DXF-Entität ${type} für Analyse/Vorschau angenähert`, count });
  }
  if (state.invalid > 0) {
    warnings.push({ code: "dxf.invalid-coordinates", message: "DXF-Entitäten mit ungültigen Pflichtkoordinaten verworfen", count: state.invalid });
  }

  return {
    fileName,
    format: "dxf",
    features: state.features,
    declaredCrs: findDeclaredCrs(groups),
    warnings,
    layerMetadata: parseLayerMetadata(groups, state.features),
  };
}

function parseLayerMetadata(groups: DxfGroup[], features: GeoFeature[]): GeoLayerMetadata[] {
  const layers = new Map<string, GeoLayerMetadata>();
  for (let index = 0; index < groups.length; index++) {
    const marker = groups[index];
    if (marker?.code !== 0 || marker.value.toUpperCase() !== "LAYER") continue;
    const next = findNextMarker(groups, index + 1, groups.length);
    const entries = groups.slice(index + 1, next);
    const name = valueForCode(entries, 2)?.trim() || "0";
    const rawAci = integerForCode(entries, 62) ?? 7;
    const aciColor = Math.abs(rawAci);
    const trueColor = integerForCode(entries, 420);
    const flags = integerForCode(entries, 70) ?? 0;
    layers.set(name, {
      name,
      color: trueColor === null ? aciToHex(aciColor) : trueColorToHex(trueColor),
      aciColor,
      trueColor,
      lineType: valueForCode(entries, 6)?.trim() || "CONTINUOUS",
      lineWeight: integerForCode(entries, 370),
      flags,
      isOff: rawAci < 0,
      isFrozen: (flags & 1) === 1,
      isLocked: (flags & 4) === 4,
      isPlottable: (integerForCode(entries, 290) ?? 1) !== 0,
    });
    index = next - 1;
  }

  for (const name of new Set(features.map((feature) => feature.layer))) {
    if (layers.has(name)) continue;
    layers.set(name, defaultLayerMetadata(name));
  }
  return [...layers.values()]
    .filter((layer) => features.some((feature) => feature.layer === layer.name))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" }));
}

function defaultLayerMetadata(name: string): GeoLayerMetadata {
  return {
    name,
    color: "#ffffff",
    aciColor: 7,
    trueColor: null,
    lineType: "CONTINUOUS",
    lineWeight: null,
    flags: 0,
    isOff: false,
    isFrozen: false,
    isLocked: false,
    isPlottable: true,
  };
}

function trueColorToHex(value: number): string {
  return `#${(value & 0xffffff).toString(16).padStart(6, "0")}`;
}

function aciToHex(aci: number): string {
  const palette: Record<number, string> = {
    1: "#ff0000", 2: "#ffff00", 3: "#00ff00", 4: "#00ffff",
    5: "#0000ff", 6: "#ff00ff", 7: "#ffffff", 8: "#808080", 9: "#c0c0c0",
  };
  return palette[aci] ?? "#ffffff";
}

function parseGroups(text: string): DxfGroup[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const groups: DxfGroup[] = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index]?.trim() ?? "", 10);
    if (!Number.isFinite(code)) continue;
    groups.push({ code, value: lines[index + 1]?.trim() ?? "" });
  }
  return groups;
}

function findEntitiesRange(groups: DxfGroup[]): { start: number; end: number } | null {
  for (let index = 0; index < groups.length - 1; index++) {
    if (groups[index]?.code === 0 && groups[index]?.value === "SECTION" && groups[index + 1]?.code === 2 && groups[index + 1]?.value === "ENTITIES") {
      const end = groups.findIndex((group, candidate) => candidate > index + 1 && group.code === 0 && group.value === "ENDSEC");
      return { start: index + 2, end: end >= 0 ? end : groups.length };
    }
  }
  return null;
}

function parseClassicPolyline(groups: DxfGroup[], start: number, end: number, state: ParseState): number {
  const headerEnd = findNextMarker(groups, start + 1, end);
  const header = groups.slice(start + 1, headerEnd);
  const layer = valueForCode(header, 8) || "0";
  const flags = integerForCode(header, 70) ?? 0;
  const points: Position3[] = [];
  let index = headerEnd;

  while (index < end) {
    const marker = groups[index];
    if (!marker || marker.code !== 0) {
      index++;
      continue;
    }
    if (marker.value === "SEQEND") {
      index = findNextMarker(groups, index + 1, end);
      break;
    }
    if (marker.value !== "VERTEX") break;
    const next = findNextMarker(groups, index + 1, end);
    const point = pointFromCodes(groups.slice(index + 1, next), 10, 20, 30);
    if (point) points.push(point);
    else state.invalid++;
    index = next;
  }

  if (points.length > 0) {
    const closed = (flags & 1) === 1;
    pushFeature(state, "POLYLINE", layer, closed && points.length >= 3 ? "polygon" : points.length === 2 ? "line" : "polyline", dedupeClosing(points));
  } else {
    increment(state.skipped, "POLYLINE");
  }
  return index;
}

function parseEntity(type: string, entries: DxfGroup[], state: ParseState): void {
  const layer = valueForCode(entries, 8) || "0";
  let points: Position3[] = [];
  let kind: GeometryKind = "anchor";
  let approximation: string | undefined;

  switch (type) {
    case "POINT":
      points = optionalPoint(pointFromCodes(entries, 10, 20, 30));
      kind = "point";
      break;
    case "LINE":
      points = [pointFromCodes(entries, 10, 20, 30), pointFromCodes(entries, 11, 21, 31)].filter(isPosition);
      kind = "line";
      break;
    case "LWPOLYLINE": {
      points = sequentialPoints(entries);
      const closed = ((integerForCode(entries, 70) ?? 0) & 1) === 1;
      kind = closed && points.length >= 3 ? "polygon" : points.length === 2 ? "line" : "polyline";
      points = dedupeClosing(points);
      if (entries.some((entry) => entry.code === 42 && number(entry.value) !== 0)) {
        approximation = "Bulge-Bögen werden in der Vorschau als gerade Segmente dargestellt.";
      }
      break;
    }
    case "CIRCLE":
    case "ARC": {
      const center = pointFromCodes(entries, 10, 20, 30);
      const radius = numberForCode(entries, 40);
      if (center && radius !== null && radius >= 0) {
        const start = type === "ARC" ? degreesToRadians(numberForCode(entries, 50) ?? 0) : 0;
        const endRaw = type === "ARC" ? degreesToRadians(numberForCode(entries, 51) ?? 360) : Math.PI * 2;
        const end = endRaw < start ? endRaw + Math.PI * 2 : endRaw;
        points = approximateArc(center, radius, start, end, 32);
        kind = type === "CIRCLE" ? "polygon" : "polyline";
        approximation = `${type} wurde für die Vorschau mit 32 Segmenten angenähert.`;
      }
      break;
    }
    case "TEXT":
    case "MTEXT":
    case "INSERT":
    case "ATTRIB":
    case "ATTDEF":
      points = optionalPoint(pointFromCodes(entries, 10, 20, 30));
      kind = "anchor";
      approximation = `${type} wird räumlich nur über seinen Einfüge-/Ankerpunkt bewertet.`;
      break;
    case "3DFACE":
    case "SOLID":
    case "TRACE":
      points = fixedCodePoints(entries, [10, 11, 12, 13]);
      kind = points.length >= 3 ? "polygon" : "polyline";
      break;
    case "SPLINE":
    case "HATCH":
    case "DIMENSION":
    case "LEADER":
    case "MLEADER":
    case "ELLIPSE":
      points = sequentialPoints(entries);
      kind = points.length >= 2 ? "polyline" : "anchor";
      approximation = `${type} wird nur über verfügbare Stütz-/Definitionspunkte bewertet.`;
      break;
    default:
      points = sequentialPoints(entries);
      if (points.length > 0) {
        kind = points.length === 1 ? "anchor" : "polyline";
        approximation = `Unbekannte Entität ${type} wird nur über gefundene Koordinatengruppen bewertet.`;
      }
  }

  if (points.length === 0) {
    increment(state.skipped, type);
    return;
  }
  if (type === "LINE" && points.length < 2) {
    state.invalid++;
    return;
  }
  if (approximation) increment(state.approximated, type);
  pushFeature(state, type, layer, kind, points, approximation);
}

function pushFeature(
  state: ParseState,
  sourceType: string,
  layer: string,
  kind: GeometryKind,
  points: Position3[],
  approximation?: string,
): void {
  state.features.push({
    id: `dxf-${state.nextId++}`,
    layer,
    kind,
    points,
    sourceType,
    approximation,
  });
}

function sequentialPoints(entries: DxfGroup[]): Position3[] {
  const points: Position3[] = [];
  let pending: Partial<Position3> | null = null;
  const defaultZ = numberForCode(entries, 38) ?? 0;
  for (const entry of entries) {
    if (entry.code === 10) {
      if (pending && pending.x !== undefined && pending.y !== undefined) {
        points.push({ x: pending.x, y: pending.y, z: pending.z ?? defaultZ });
      }
      pending = { x: number(entry.value), z: defaultZ };
    } else if (entry.code === 20 && pending) {
      pending.y = number(entry.value);
    } else if (entry.code === 30 && pending) {
      pending.z = number(entry.value);
    }
  }
  if (pending?.x !== undefined && pending.y !== undefined) {
    points.push({ x: pending.x, y: pending.y, z: pending.z ?? defaultZ });
  }
  return points.filter((point) => [point.x, point.y, point.z].every(Number.isFinite));
}

function fixedCodePoints(entries: DxfGroup[], xCodes: number[]): Position3[] {
  return xCodes.map((xCode) => pointFromCodes(entries, xCode, xCode + 10, xCode + 20)).filter(isPosition);
}

function pointFromCodes(entries: DxfGroup[], xCode: number, yCode: number, zCode: number): Position3 | null {
  const x = numberForCode(entries, xCode);
  const y = numberForCode(entries, yCode);
  const z = numberForCode(entries, zCode) ?? 0;
  return x !== null && y !== null && [x, y, z].every(Number.isFinite) ? { x, y, z } : null;
}

function approximateArc(center: Position3, radius: number, start: number, end: number, segments: number): Position3[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = start + ((end - start) * index) / segments;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius, z: center.z };
  });
}

function dedupeClosing(points: Position3[]): Position3[] {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  return first && last && Math.hypot(first.x - last.x, first.y - last.y, first.z - last.z) <= 0.001
    ? points.slice(0, -1)
    : points;
}

function findDeclaredCrs(groups: DxfGroup[]): string | null {
  for (const group of groups) {
    if (group.code !== 999) continue;
    const match = group.value.match(/(?:CRS\s+)?(EPSG:\d{4,6})/i);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return null;
}

function findNextMarker(groups: DxfGroup[], start: number, end: number): number {
  for (let index = start; index < end; index++) {
    if (groups[index]?.code === 0) return index;
  }
  return end;
}

function valueForCode(entries: DxfGroup[], code: number): string | null {
  return entries.find((entry) => entry.code === code)?.value ?? null;
}

function numberForCode(entries: DxfGroup[], code: number): number | null {
  const value = valueForCode(entries, code);
  if (value === null) return null;
  const parsed = number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerForCode(entries: DxfGroup[], code: number): number | null {
  const value = valueForCode(entries, code);
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function number(value: string): number {
  return Number.parseFloat(value.trim());
}

function optionalPoint(point: Position3 | null): Position3[] {
  return point ? [point] : [];
}

function isPosition(value: Position3 | null): value is Position3 {
  return value !== null;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}
