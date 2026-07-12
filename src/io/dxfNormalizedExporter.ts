import type { GeoFeature, GeoLayerMetadata, Position3 } from "../model";

/** Vom Pointcloud-Manager übernommene, dort gegen AutoCAD/OEM geprüfte Profile. */
export type DxfAcadVersion = "AC1015" | "AC1032";

export interface NormalizedDxfOptions {
  acadVersion: DxfAcadVersion;
  insUnits: 0 | 6;
  coordinateSystemLabel: string | null;
  comments: string[];
  layerMetadata?: GeoLayerMetadata[];
}

/**
 * Schreibt ein vollständiges AC1015-/AC1032-Gerüst nach der Exportstrategie des
 * Pointcloud-Managers. Beide Profile verwenden dieselbe geprüfte Struktur; nur
 * der $ACADVER-Stempel wechselt. AC1015 ist der OEM-kompatible Default.
 */
export function exportNormalizedDxf(features: GeoFeature[], options: NormalizedDxfOptions): string {
  let handleCounter = 0x100;
  const nextHandle = (): string => (handleCounter++).toString(16).toUpperCase();
  const layerPlan = buildLayerPlan(features, options.layerMetadata ?? []);
  const extent = bounds3D(features);
  const chunks: string[] = [];

  writeHeader(chunks, options, extent);
  writeTables(chunks, layerPlan, nextHandle);
  writeBlocks(chunks, nextHandle);
  writeEntities(chunks, features, layerPlan.names, nextHandle);
  writeObjects(chunks, nextHandle);
  pushPair(chunks, 0, "EOF");
  return `${chunks.join("\n")}\n`;
}

interface LayerPlan {
  names: Map<string, string>;
  entries: Array<{ sourceName: string; dxfName: string; metadata: GeoLayerMetadata }>;
  defaultMetadata: GeoLayerMetadata;
}

function buildLayerPlan(features: GeoFeature[], metadata: GeoLayerMetadata[]): LayerPlan {
  const metadataByName = new Map(metadata.map((entry) => [entry.name, entry]));
  const sourceNames = [...new Set(features.map((feature) => feature.layer))];
  const names = new Map<string, string>();
  const taken = new Set<string>(["0"]);
  const entries: LayerPlan["entries"] = [];
  const defaultMetadata = metadataByName.get("0") ?? fallbackMetadata("0");

  for (const sourceName of sourceNames) {
    if (sourceName === "0") {
      names.set(sourceName, "0");
      continue;
    }
    const base = normalizeDxfName(sourceName);
    let candidate = base;
    for (let suffix = 2; taken.has(candidate.toLowerCase()); suffix++) {
      const tail = `_${suffix}`;
      candidate = base.slice(0, 255 - tail.length) + tail;
    }
    taken.add(candidate.toLowerCase());
    names.set(sourceName, candidate);
    entries.push({
      sourceName,
      dxfName: candidate,
      metadata: metadataByName.get(sourceName) ?? fallbackMetadata(sourceName),
    });
  }
  return { names, entries, defaultMetadata };
}

function writeHeader(
  chunks: string[],
  options: NormalizedDxfOptions,
  extent: { min: Position3; max: Position3 },
): void {
  pushPair(chunks, 0, "SECTION");
  pushPair(chunks, 2, "HEADER");
  pushPair(chunks, 9, "$ACADVER");
  pushPair(chunks, 1, options.acadVersion);
  pushPair(chunks, 9, "$HANDSEED");
  pushPair(chunks, 5, "7FFFFFFF");
  pushPair(chunks, 9, "$INSUNITS");
  pushPair(chunks, 70, options.insUnits);
  pushPair(chunks, 9, "$LWDISPLAY");
  pushPair(chunks, 290, 1);
  writeExtent(chunks, "$EXTMIN", extent.min);
  writeExtent(chunks, "$EXTMAX", extent.max);
  if (options.coordinateSystemLabel) pushPair(chunks, 999, `CRS ${options.coordinateSystemLabel}`);
  pushPair(chunks, 999, options.insUnits === 6 ? "Units: meters" : "Units: unitless");
  for (const comment of options.comments) pushPair(chunks, 999, comment);
  pushPair(chunks, 0, "ENDSEC");
}

function writeTables(chunks: string[], plan: LayerPlan, nextHandle: () => string): void {
  pushPair(chunks, 0, "SECTION");
  pushPair(chunks, 2, "TABLES");

  pushPair(chunks, 0, "TABLE");
  pushPair(chunks, 2, "LTYPE");
  tableHandle(chunks, nextHandle, 3);
  writeLinetype(chunks, "ByBlock", "", nextHandle);
  writeLinetype(chunks, "ByLayer", "", nextHandle);
  writeLinetype(chunks, "CONTINUOUS", "Solid line", nextHandle);
  pushPair(chunks, 0, "ENDTAB");

  pushPair(chunks, 0, "TABLE");
  pushPair(chunks, 2, "LAYER");
  tableHandle(chunks, nextHandle, plan.entries.length + 1);
  writeLayer(chunks, "0", plan.defaultMetadata, nextHandle);
  for (const entry of plan.entries) writeLayer(chunks, entry.dxfName, entry.metadata, nextHandle);
  pushPair(chunks, 0, "ENDTAB");

  pushPair(chunks, 0, "TABLE");
  pushPair(chunks, 2, "STYLE");
  tableHandle(chunks, nextHandle, 1);
  pushPair(chunks, 0, "STYLE");
  recordHandle(chunks, nextHandle, "AcDbTextStyleTableRecord");
  pushPair(chunks, 2, "Standard");
  pushPair(chunks, 70, 0);
  pushPair(chunks, 40, "0");
  pushPair(chunks, 41, "1");
  pushPair(chunks, 50, "0");
  pushPair(chunks, 71, 0);
  pushPair(chunks, 42, "2.5");
  pushPair(chunks, 3, "txt");
  pushPair(chunks, 4, "");
  pushPair(chunks, 0, "ENDTAB");

  pushPair(chunks, 0, "TABLE");
  pushPair(chunks, 2, "APPID");
  tableHandle(chunks, nextHandle, 1);
  pushPair(chunks, 0, "APPID");
  recordHandle(chunks, nextHandle, "AcDbRegAppTableRecord");
  pushPair(chunks, 2, "ACAD");
  pushPair(chunks, 70, 0);
  pushPair(chunks, 0, "ENDTAB");

  writeEmptyTable(chunks, "VIEW", nextHandle);
  writeEmptyTable(chunks, "UCS", nextHandle);
  writeEmptyTable(chunks, "VPORT", nextHandle);

  pushPair(chunks, 0, "TABLE");
  pushPair(chunks, 2, "DIMSTYLE");
  pushPair(chunks, 5, nextHandle());
  pushPair(chunks, 100, "AcDbSymbolTable");
  pushPair(chunks, 100, "AcDbDimStyleTable");
  pushPair(chunks, 70, 0);
  pushPair(chunks, 0, "ENDTAB");

  pushPair(chunks, 0, "TABLE");
  pushPair(chunks, 2, "BLOCK_RECORD");
  tableHandle(chunks, nextHandle, 2);
  writeBlockRecord(chunks, "*Model_Space", nextHandle);
  writeBlockRecord(chunks, "*Paper_Space", nextHandle);
  pushPair(chunks, 0, "ENDTAB");
  pushPair(chunks, 0, "ENDSEC");
}

function tableHandle(chunks: string[], nextHandle: () => string, count: number): void {
  pushPair(chunks, 5, nextHandle());
  pushPair(chunks, 100, "AcDbSymbolTable");
  pushPair(chunks, 70, count);
}

function recordHandle(chunks: string[], nextHandle: () => string, subclass: string): void {
  pushPair(chunks, 5, nextHandle());
  pushPair(chunks, 100, "AcDbSymbolTableRecord");
  pushPair(chunks, 100, subclass);
}

function writeLinetype(chunks: string[], name: string, description: string, nextHandle: () => string): void {
  pushPair(chunks, 0, "LTYPE");
  recordHandle(chunks, nextHandle, "AcDbLinetypeTableRecord");
  pushPair(chunks, 2, name);
  pushPair(chunks, 70, 0);
  pushPair(chunks, 3, description);
  pushPair(chunks, 72, 65);
  pushPair(chunks, 73, 0);
  pushPair(chunks, 40, "0.0");
}

function writeLayer(chunks: string[], name: string, metadata: GeoLayerMetadata, nextHandle: () => string): void {
  pushPair(chunks, 0, "LAYER");
  recordHandle(chunks, nextHandle, "AcDbLayerTableRecord");
  pushPair(chunks, 2, name);
  pushPair(chunks, 70, 0);
  pushPair(chunks, 62, rgbToAci(metadata.color));
  pushPair(chunks, 420, hexToTrueColor(metadata.color));
  pushPair(chunks, 6, "CONTINUOUS");
  pushPair(chunks, 370, isValidLineWeight(metadata.lineWeight) ? metadata.lineWeight : -3);
  pushPair(chunks, 390, "7FFFFFFF");
}

function writeEmptyTable(chunks: string[], name: string, nextHandle: () => string): void {
  pushPair(chunks, 0, "TABLE");
  pushPair(chunks, 2, name);
  tableHandle(chunks, nextHandle, 0);
  pushPair(chunks, 0, "ENDTAB");
}

function writeBlockRecord(chunks: string[], name: string, nextHandle: () => string): void {
  pushPair(chunks, 0, "BLOCK_RECORD");
  recordHandle(chunks, nextHandle, "AcDbBlockTableRecord");
  pushPair(chunks, 2, name);
}

function writeBlocks(chunks: string[], nextHandle: () => string): void {
  pushPair(chunks, 0, "SECTION");
  pushPair(chunks, 2, "BLOCKS");
  writeBlock(chunks, "*Model_Space", false, nextHandle);
  writeBlock(chunks, "*Paper_Space", true, nextHandle);
  pushPair(chunks, 0, "ENDSEC");
}

function writeBlock(chunks: string[], name: string, paperSpace: boolean, nextHandle: () => string): void {
  pushPair(chunks, 0, "BLOCK");
  pushPair(chunks, 5, nextHandle());
  pushPair(chunks, 100, "AcDbEntity");
  if (paperSpace) pushPair(chunks, 67, 1);
  pushPair(chunks, 8, "0");
  pushPair(chunks, 100, "AcDbBlockBegin");
  pushPair(chunks, 2, name);
  pushPair(chunks, 70, 0);
  pushPoint(chunks, { x: 0, y: 0, z: 0 });
  pushPair(chunks, 3, name);
  pushPair(chunks, 1, "");
  pushPair(chunks, 0, "ENDBLK");
  pushPair(chunks, 5, nextHandle());
  pushPair(chunks, 100, "AcDbEntity");
  if (paperSpace) pushPair(chunks, 67, 1);
  pushPair(chunks, 8, "0");
  pushPair(chunks, 100, "AcDbBlockEnd");
}

function writeEntities(
  chunks: string[],
  features: GeoFeature[],
  layerNames: Map<string, string>,
  nextHandle: () => string,
): void {
  pushPair(chunks, 0, "SECTION");
  pushPair(chunks, 2, "ENTITIES");
  for (const feature of features) writeFeature(chunks, feature, layerNames.get(feature.layer) ?? "0", nextHandle);
  pushPair(chunks, 0, "ENDSEC");
}

function writeFeature(chunks: string[], feature: GeoFeature, layer: string, nextHandle: () => string): void {
  const points = dedupeClosing(feature.points);
  if (feature.kind === "point" || feature.kind === "anchor" || points.length === 1) {
    const point = points[0];
    if (!point) return;
    pushPair(chunks, 0, "POINT");
    entityHandle(chunks, nextHandle, layer);
    pushPair(chunks, 100, "AcDbPoint");
    pushPoint(chunks, point);
    return;
  }
  if ((feature.kind === "line" || points.length === 2) && points.length === 2) {
    pushPair(chunks, 0, "LINE");
    entityHandle(chunks, nextHandle, layer);
    pushPair(chunks, 100, "AcDbLine");
    pushPoint(chunks, points[0]!);
    pushPair(chunks, 11, formatDxfNumber(points[1]!.x));
    pushPair(chunks, 21, formatDxfNumber(points[1]!.y));
    pushPair(chunks, 31, formatDxfNumber(points[1]!.z));
    return;
  }

  pushPair(chunks, 0, "POLYLINE");
  entityHandle(chunks, nextHandle, layer);
  pushPair(chunks, 100, "AcDb3dPolyline");
  pushPair(chunks, 66, 1);
  pushPoint(chunks, { x: 0, y: 0, z: 0 });
  pushPair(chunks, 70, feature.kind === "polygon" ? 9 : 8);
  pushPair(chunks, 370, -1);
  for (const point of points) {
    pushPair(chunks, 0, "VERTEX");
    entityHandle(chunks, nextHandle, layer);
    pushPair(chunks, 100, "AcDbVertex");
    pushPair(chunks, 100, "AcDb3dPolylineVertex");
    pushPoint(chunks, point);
  }
  pushPair(chunks, 0, "SEQEND");
  pushPair(chunks, 5, nextHandle());
  pushPair(chunks, 100, "AcDbEntity");
}

function entityHandle(chunks: string[], nextHandle: () => string, layer: string): void {
  pushPair(chunks, 5, nextHandle());
  pushPair(chunks, 100, "AcDbEntity");
  pushPair(chunks, 8, layer);
}

function writeObjects(chunks: string[], nextHandle: () => string): void {
  pushPair(chunks, 0, "SECTION");
  pushPair(chunks, 2, "OBJECTS");
  const root = nextHandle();
  const group = nextHandle();
  pushPair(chunks, 0, "DICTIONARY");
  pushPair(chunks, 5, root);
  pushPair(chunks, 330, "0");
  pushPair(chunks, 100, "AcDbDictionary");
  pushPair(chunks, 281, 1);
  pushPair(chunks, 3, "ACAD_GROUP");
  pushPair(chunks, 350, group);
  pushPair(chunks, 0, "DICTIONARY");
  pushPair(chunks, 5, group);
  pushPair(chunks, 330, root);
  pushPair(chunks, 100, "AcDbDictionary");
  pushPair(chunks, 281, 1);
  pushPair(chunks, 0, "ENDSEC");
}

function writeExtent(chunks: string[], name: string, point: Position3): void {
  pushPair(chunks, 9, name);
  pushPoint(chunks, point);
}

function pushPoint(chunks: string[], point: Position3): void {
  pushPair(chunks, 10, formatDxfNumber(point.x));
  pushPair(chunks, 20, formatDxfNumber(point.y));
  pushPair(chunks, 30, formatDxfNumber(point.z));
}

function bounds3D(features: GeoFeature[]): { min: Position3; max: Position3 } {
  const points = features.flatMap((feature) => feature.points);
  return {
    min: { x: Math.min(...points.map((p) => p.x)), y: Math.min(...points.map((p) => p.y)), z: Math.min(...points.map((p) => p.z)) },
    max: { x: Math.max(...points.map((p) => p.x)), y: Math.max(...points.map((p) => p.y)), z: Math.max(...points.map((p) => p.z)) },
  };
}

function dedupeClosing(points: Position3[]): Position3[] {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points.at(-1);
  return first && last && first.x === last.x && first.y === last.y && first.z === last.z ? points.slice(0, -1) : points;
}

function normalizeDxfName(name: string): string {
  const german = name
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss");
  return german.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[<>/\\":;?*|=`]/g, "_")
    .replace(/[\u0000-\u001f]/g, "_")
    .replace(/_+/g, "_")
    .replace(/_+$/g, "")
    .slice(0, 255) || "Layer";
}

function fallbackMetadata(name: string): GeoLayerMetadata {
  return { name, color: "#ffffff", aciColor: 7, trueColor: null, lineType: "CONTINUOUS", lineWeight: null, flags: 0, isOff: false, isFrozen: false, isLocked: false, isPlottable: true };
}

const LINE_WEIGHTS = new Set([0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211]);
function isValidLineWeight(value: number | null): value is number { return value !== null && LINE_WEIGHTS.has(value); }

function rgbToAci(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  if (r >= 220 && g < 120 && b < 120) return 1;
  if (r >= 220 && g >= 220 && b < 120) return 2;
  if (g >= 180 && r < 160 && b < 160) return 3;
  if (g >= 180 && b >= 180) return 4;
  if (b >= 180 && r < 160 && g < 160) return 5;
  if (r >= 200 && b >= 200) return 6;
  return 7;
}

function hexToTrueColor(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (r << 16) + (g << 8) + b;
}

function hexToRgb(hex: string): readonly [number, number, number] {
  const normalized = hex.replace("#", "");
  const source = normalized.length === 3 ? normalized.split("").map((character) => character + character).join("") : normalized;
  const value = Number.parseInt(source, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
}

function formatDxfNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1e15) return BigInt(Math.round(value)).toString();
  return value.toFixed(9).replace(/\.?0+$/, "") || "0";
}

function pushPair(chunks: string[], code: number, value: string | number): void {
  chunks.push(String(code), String(value));
}
