import type { GeoDataset, GeoFeature, GeometryKind, ImportWarning, Position3 } from "../model";

interface RawFeature {
  geometry: unknown;
  properties: Record<string, unknown>;
}

interface ParseContext {
  fileName: string;
  features: GeoFeature[];
  unsupported: Map<string, number>;
  invalidGeometryCount: number;
  holesSkipped: number;
  nextId: number;
}

export function parseGeoJson(text: string, fileName: string): GeoDataset {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    throw new Error("Die Datei ist kein gültiges JSON.");
  }
  if (!isRecord(root)) throw new Error("GeoJSON muss ein Objekt als Wurzelelement enthalten.");

  const rawFeatures = normalizeRoot(root);
  const context: ParseContext = {
    fileName,
    features: [],
    unsupported: new Map(),
    invalidGeometryCount: 0,
    holesSkipped: 0,
    nextId: 1,
  };

  for (const feature of rawFeatures) {
    parseGeometry(feature.geometry, feature.properties, deriveLayer(feature.properties, fileName), context);
  }

  const warnings: ImportWarning[] = [];
  for (const [type, count] of context.unsupported) {
    warnings.push({ code: `geojson.unsupported.${type}`, message: `Nicht unterstützter GeoJSON-Typ ${type}`, count });
  }
  if (context.invalidGeometryCount > 0) {
    warnings.push({ code: "geojson.invalid-geometry", message: "Ungültige oder zu kurze Geometrien verworfen", count: context.invalidGeometryCount });
  }
  if (context.holesSkipped > 0) {
    warnings.push({ code: "geojson.holes-preview", message: "Polygonlöcher in der aktuellen Vorschau nicht dargestellt", count: context.holesSkipped });
  }

  return {
    fileName,
    format: "geojson",
    features: context.features,
    declaredCrs: readDeclaredCrs(root),
    warnings,
  };
}

function normalizeRoot(root: Record<string, unknown>): RawFeature[] {
  if (root.type === "FeatureCollection" && Array.isArray(root.features)) {
    return root.features
      .filter(isRecord)
      .map((feature) => ({
        geometry: feature.geometry,
        properties: isRecord(feature.properties) ? feature.properties : {},
      }));
  }
  if (root.type === "Feature") {
    return [{ geometry: root.geometry, properties: isRecord(root.properties) ? root.properties : {} }];
  }
  if (typeof root.type === "string") return [{ geometry: root, properties: {} }];
  throw new Error("Nicht unterstützte GeoJSON-Wurzelstruktur.");
}

function parseGeometry(
  raw: unknown,
  properties: Record<string, unknown>,
  layer: string,
  context: ParseContext,
): void {
  if (!isRecord(raw) || typeof raw.type !== "string") {
    context.invalidGeometryCount++;
    return;
  }

  const coordinates = raw.coordinates;
  switch (raw.type) {
    case "Point":
      pushFeature(toPoints([coordinates]), "point", raw.type, layer, properties, context);
      break;
    case "MultiPoint":
      for (const point of asArray(coordinates)) {
        pushFeature(toPoints([point]), "point", raw.type, layer, properties, context);
      }
      break;
    case "LineString":
      pushFeature(toPoints(asArray(coordinates)), "polyline", raw.type, layer, properties, context);
      break;
    case "MultiLineString":
      for (const line of asArray(coordinates)) {
        pushFeature(toPoints(asArray(line)), "polyline", raw.type, layer, properties, context);
      }
      break;
    case "Polygon":
      pushPolygon(asArray(coordinates), raw.type, layer, properties, context);
      break;
    case "MultiPolygon":
      for (const polygon of asArray(coordinates)) {
        pushPolygon(asArray(polygon), raw.type, layer, properties, context);
      }
      break;
    case "GeometryCollection":
      for (const geometry of asArray(raw.geometries)) {
        parseGeometry(geometry, properties, layer, context);
      }
      break;
    default:
      context.unsupported.set(raw.type, (context.unsupported.get(raw.type) ?? 0) + 1);
  }
}

function pushPolygon(
  rings: unknown[],
  sourceType: string,
  layer: string,
  properties: Record<string, unknown>,
  context: ParseContext,
): void {
  const outer = rings[0];
  context.holesSkipped += Math.max(0, rings.length - 1);
  const points = dedupeClosingPoint(toPoints(asArray(outer)));
  pushFeature(points, "polygon", sourceType, layer, properties, context);
}

function pushFeature(
  points: Position3[],
  requestedKind: GeometryKind,
  sourceType: string,
  layer: string,
  properties: Record<string, unknown>,
  context: ParseContext,
): void {
  const minimum = requestedKind === "polygon" ? 3 : requestedKind === "polyline" ? 2 : 1;
  if (points.length < minimum) {
    context.invalidGeometryCount++;
    return;
  }
  const kind = requestedKind === "polyline" && points.length === 2 ? "line" : requestedKind;
  context.features.push({
    id: `geojson-${context.nextId++}`,
    layer,
    kind,
    points,
    sourceType,
    properties,
  });
}

function toPoints(rawPositions: unknown[]): Position3[] {
  const points: Position3[] = [];
  for (const raw of rawPositions) {
    if (!Array.isArray(raw)) continue;
    const x = raw[0];
    const y = raw[1];
    const z = raw[2] ?? 0;
    if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") continue;
    if (![x, y, z].every(Number.isFinite)) continue;
    points.push({ x, y, z });
  }
  return points;
}

function dedupeClosingPoint(points: Position3[]): Position3[] {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first && last && first.x === last.x && first.y === last.y && first.z === last.z) {
    return points.slice(0, -1);
  }
  return points;
}

function deriveLayer(properties: Record<string, unknown>, fileName: string): string {
  for (const key of ["layer", "Layer", "ebene", "Ebene", "name", "Name"]) {
    const value = properties[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fileName.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "") || "GeoJSON";
}

function readDeclaredCrs(root: Record<string, unknown>): string | null {
  const crs = root.crs;
  if (!isRecord(crs) || !isRecord(crs.properties)) return null;
  const name = crs.properties.name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
