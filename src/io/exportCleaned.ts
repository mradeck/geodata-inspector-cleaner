import { inspectDataset } from "../analysis/inspectDataset";
import { classifyFeature, filterFeatures, type FeatureFilterSelection } from "../analysis/layerFilter";
import type { Bounds2D, GeoDataset, GeoFeature, GeoLayerMetadata, InspectionReport, Position3, SourceFormat } from "../model";
import { parseDxf } from "./parseDxf";
import { parseGeoJson } from "./parseGeoJson";

export type CleanerErrorCode =
  | "primary-not-confirmed"
  | "no-primary"
  | "nothing-to-remove"
  | "nothing-kept"
  | "validation-count"
  | "validation-clusters"
  | "validation-bounds";

export class CleanerError extends Error {
  constructor(readonly code: CleanerErrorCode) {
    super(code);
  }
}

export interface CleanedExport {
  content: string;
  fileName: string;
  mimeType: string;
  keptFeatureCount: number;
  removedFeatureCount: number;
  spatialRemovedFeatureCount: number;
  filterRemovedFeatureCount: number;
  validatedBounds: Bounds2D;
  outputFormat: SourceFormat;
}

interface CleaningAudit {
  sourceFile: string;
  keptFeatureCount: number;
  removedFeatureCount: number;
  primaryBounds: Bounds2D;
  outputBounds: Bounds2D;
  spatialRemovedFeatureCount: number;
  filterRemovedFeatureCount: number;
  filterRemovedByLayerAndType: string[];
  sourceFormat: SourceFormat;
  outputFormat: SourceFormat;
}

export interface CleanedExportOptions {
  featureFilterSelection?: FeatureFilterSelection;
  outputFormat?: SourceFormat;
  /** Erlaubt eine reine Formatkonvertierung, auch wenn kein Feature entfernt wird. */
  allowUnchangedOutput?: boolean;
}

/**
 * Erzeugt eine neue, normalisierte Datei aus dem manuell bestätigten Hauptcluster.
 * Der DXF-Pfad basiert auf dem DXFExporter des Pointcloud-Managers und wurde an
 * das formatneutrale GeoFeature-Modell dieser App angepasst.
 */
export function createCleanedExport(
  dataset: GeoDataset,
  report: InspectionReport,
  options: CleanedExportOptions = {},
): CleanedExport {
  if (report.primarySelection !== "manual") throw new CleanerError("primary-not-confirmed");
  const primary = report.clusters.find((cluster) => cluster.isPrimary);
  if (!primary) throw new CleanerError("no-primary");
  const keepIds = new Set(primary.featureIds);
  const primaryFeatures = dataset.features.filter((feature) => keepIds.has(feature.id));
  const keptFeatures = options.featureFilterSelection
    ? filterFeatures(primaryFeatures, options.featureFilterSelection)
    : primaryFeatures;
  if (keptFeatures.length === 0) throw new CleanerError("nothing-kept");
  const spatialRemovedFeatureCount = dataset.features.length - primaryFeatures.length;
  const filterRemovedFeatures = primaryFeatures.filter((feature) => !keptFeatures.includes(feature));
  const filterRemovedFeatureCount = filterRemovedFeatures.length;
  const removedFeatureCount = dataset.features.length - keptFeatures.length;
  if (removedFeatureCount === 0 && !options.allowUnchangedOutput) throw new CleanerError("nothing-to-remove");
  const outputBounds = bounds2D(keptFeatures);
  const outputFormat = options.outputFormat ?? dataset.format;

  const extension = outputFormat === "dxf" ? "dxf" : "geojson";
  const suffix = removedFeatureCount === 0 && outputFormat !== dataset.format ? "converted" : "cleaned";
  const outputName = `${baseName(dataset.fileName)}-${suffix}.${extension}`;
  const audit: CleaningAudit = {
    sourceFile: dataset.fileName,
    keptFeatureCount: keptFeatures.length,
    removedFeatureCount,
    primaryBounds: primary.bounds,
    outputBounds,
    spatialRemovedFeatureCount,
    filterRemovedFeatureCount,
    filterRemovedByLayerAndType: summarizeFilteredFeatures(filterRemovedFeatures),
    sourceFormat: dataset.format,
    outputFormat,
  };
  const content = outputFormat === "dxf"
    ? exportFeaturesAsDxf(
        keptFeatures,
        dataset.declaredCrs,
        audit,
        dataset.layerMetadata,
        dataset.format === "geojson" ? inferGeoJsonDxfUnits(dataset.declaredCrs) : 6,
      )
    : exportFeaturesAsGeoJson(keptFeatures, dataset.declaredCrs, audit);
  const reparsed = outputFormat === "dxf"
    ? parseDxf(content, outputName)
    : parseGeoJson(content, outputName);
  validateReimport(reparsed, keptFeatures.length, outputBounds);

  return {
    content,
    fileName: outputName,
    mimeType: outputFormat === "dxf" ? "application/dxf;charset=utf-8" : "application/geo+json;charset=utf-8",
    keptFeatureCount: keptFeatures.length,
    removedFeatureCount,
    spatialRemovedFeatureCount,
    filterRemovedFeatureCount,
    validatedBounds: outputBounds,
    outputFormat,
  };
}

export function exportFeaturesAsDxf(
  features: GeoFeature[],
  coordinateSystemLabel: string | null,
  audit?: CleaningAudit,
  layerMetadata?: GeoLayerMetadata[],
  insUnits = 6,
): string {
  const chunks: string[] = [];
  const extent = bounds3D(features);
  const layerNames = [...new Set(features.map((feature) => sanitizeLayerName(feature.layer)))];
  if (!layerNames.includes("0")) layerNames.unshift("0");
  const colorByLayer = new Map((layerMetadata ?? []).map((metadata) => [sanitizeLayerName(metadata.name), metadata.color]));

  pushPair(chunks, 0, "SECTION");
  pushPair(chunks, 2, "HEADER");
  pushPair(chunks, 9, "$ACADVER");
  pushPair(chunks, 1, "AC1015");
  pushPair(chunks, 9, "$INSUNITS");
  pushPair(chunks, 70, insUnits);
  writeExtent(chunks, "$EXTMIN", extent.min);
  writeExtent(chunks, "$EXTMAX", extent.max);
  pushPair(chunks, 999, "Normalized by geodata-inspector-cleaner using the Pointcloud Manager DXF export strategy");
  if (coordinateSystemLabel) pushPair(chunks, 999, `CRS ${coordinateSystemLabel}`);
  if (audit) {
    pushPair(chunks, 999, `Cleaner source: ${audit.sourceFile}`);
    pushPair(chunks, 999, `Cleaner retained features: ${audit.keptFeatureCount}`);
    pushPair(chunks, 999, `Cleaner removed features: ${audit.removedFeatureCount}`);
    pushPair(chunks, 999, `Cleaner spatially removed features: ${audit.spatialRemovedFeatureCount}`);
    pushPair(chunks, 999, `Cleaner object-filter removed features: ${audit.filterRemovedFeatureCount}`);
    pushPair(chunks, 999, `Cleaner confirmed main bounds: ${formatBounds(audit.primaryBounds)}`);
    pushPair(chunks, 999, `Cleaner output bounds: ${formatBounds(audit.outputBounds)}`);
    pushPair(chunks, 999, `Cleaner format conversion: ${audit.sourceFormat} -> ${audit.outputFormat}`);
    for (const entry of audit.filterRemovedByLayerAndType) pushPair(chunks, 999, `Cleaner object filter: ${entry}`);
  }
  if (insUnits === 0) pushPair(chunks, 999, "Coordinate values preserved without reprojection; DXF units are Unitless");
  pushPair(chunks, 0, "ENDSEC");

  pushPair(chunks, 0, "SECTION");
  pushPair(chunks, 2, "TABLES");
  pushPair(chunks, 0, "TABLE");
  pushPair(chunks, 2, "LAYER");
  pushPair(chunks, 70, layerNames.length);
  layerNames.forEach((name, index) => writeLayer(chunks, name, colorByLayer.get(name) ?? layerColor(index)));
  pushPair(chunks, 0, "ENDTAB");
  pushPair(chunks, 0, "ENDSEC");

  pushPair(chunks, 0, "SECTION");
  pushPair(chunks, 2, "ENTITIES");
  features.forEach((feature) => writeFeature(chunks, feature, layerNames, colorByLayer));
  pushPair(chunks, 0, "ENDSEC");
  pushPair(chunks, 0, "EOF");
  return `${chunks.join("\n")}\n`;
}

function writeExtent(chunks: string[], name: string, point: Position3): void {
  pushPair(chunks, 9, name);
  pushPair(chunks, 10, point.x);
  pushPair(chunks, 20, point.y);
  pushPair(chunks, 30, point.z);
}

function writeLayer(chunks: string[], name: string, color: string): void {
  pushPair(chunks, 0, "LAYER");
  pushPair(chunks, 2, name);
  pushPair(chunks, 70, 0);
  pushPair(chunks, 62, rgbToAci(color));
  pushPair(chunks, 420, hexToTrueColor(color));
  pushPair(chunks, 6, "CONTINUOUS");
}

function writeFeature(
  chunks: string[],
  feature: GeoFeature,
  layerNames: string[],
  colorByLayer: Map<string, string>,
): void {
  const layerName = sanitizeLayerName(feature.layer);
  const layerIndex = Math.max(0, layerNames.indexOf(layerName));
  const trueColor = hexToTrueColor(colorByLayer.get(layerName) ?? layerColor(layerIndex));
  const points = dedupeClosing(feature.points);

  if (feature.kind === "point" || feature.kind === "anchor" || points.length === 1) {
    const point = points[0];
    if (!point) return;
    pushPair(chunks, 0, "POINT");
    pushPair(chunks, 8, layerName);
    pushPair(chunks, 420, trueColor);
    pushPoint(chunks, point);
    return;
  }

  const closed = feature.kind === "polygon";
  pushPair(chunks, 0, "POLYLINE");
  pushPair(chunks, 8, layerName);
  pushPair(chunks, 66, 1);
  pushPair(chunks, 70, closed ? 9 : 8);
  pushPair(chunks, 420, trueColor);
  for (const point of points) {
    pushPair(chunks, 0, "VERTEX");
    pushPair(chunks, 8, layerName);
    pushPair(chunks, 70, 32);
    pushPoint(chunks, point);
  }
  pushPair(chunks, 0, "SEQEND");
  pushPair(chunks, 8, layerName);
}

function pushPoint(chunks: string[], point: Position3): void {
  pushPair(chunks, 10, point.x);
  pushPair(chunks, 20, point.y);
  pushPair(chunks, 30, point.z);
}

function exportFeaturesAsGeoJson(features: GeoFeature[], declaredCrs: string | null, audit: CleaningAudit): string {
  const root: Record<string, unknown> = {
    type: "FeatureCollection",
    _cleaner: {
      sourceFile: audit.sourceFile,
      keptFeatureCount: audit.keptFeatureCount,
      removedFeatureCount: audit.removedFeatureCount,
      primaryBounds: audit.primaryBounds,
      outputBounds: audit.outputBounds,
      spatialRemovedFeatureCount: audit.spatialRemovedFeatureCount,
      filterRemovedFeatureCount: audit.filterRemovedFeatureCount,
      filterRemovedByLayerAndType: audit.filterRemovedByLayerAndType,
      sourceFormat: audit.sourceFormat,
      outputFormat: audit.outputFormat,
      exportMode: "normalized",
    },
    features: features.map((feature) => ({
      type: "Feature",
      properties: {
        ...(feature.properties ?? {}),
        layer: feature.layer,
        _cleanerLayer: feature.layer,
        _cleanerSourceType: feature.sourceType,
      },
      geometry: featureGeometry(feature),
    })),
  };
  if (declaredCrs) root.crs = { type: "name", properties: { name: declaredCrs } };
  return `${JSON.stringify(root, null, 2)}\n`;
}

function featureGeometry(feature: GeoFeature): Record<string, unknown> {
  const coordinates = dedupeClosing(feature.points).map((point) => [point.x, point.y, point.z]);
  if (feature.kind === "point" || feature.kind === "anchor" || coordinates.length === 1) {
    return { type: "Point", coordinates: coordinates[0] };
  }
  if (feature.kind === "polygon") {
    return { type: "Polygon", coordinates: [[...coordinates, coordinates[0]]] };
  }
  return { type: "LineString", coordinates };
}

function validateReimport(dataset: GeoDataset, expectedFeatureCount: number, expectedBounds: Bounds2D): void {
  if (dataset.features.length !== expectedFeatureCount) throw new CleanerError("validation-count");
  const report = inspectDataset(dataset);
  if (report.clusters.length !== 1) throw new CleanerError("validation-clusters");
  if (!report.fullBounds || !sameBounds(report.fullBounds, expectedBounds)) throw new CleanerError("validation-bounds");
}

function sameBounds(left: Bounds2D, right: Bounds2D): boolean {
  const scale = Math.max(1, Math.abs(right.minX), Math.abs(right.minY), Math.abs(right.maxX), Math.abs(right.maxY));
  const tolerance = scale * 1e-12;
  return Math.abs(left.minX - right.minX) <= tolerance &&
    Math.abs(left.minY - right.minY) <= tolerance &&
    Math.abs(left.maxX - right.maxX) <= tolerance &&
    Math.abs(left.maxY - right.maxY) <= tolerance;
}

function bounds3D(features: GeoFeature[]): { min: Position3; max: Position3 } {
  const points = features.flatMap((feature) => feature.points);
  return {
    min: {
      x: Math.min(...points.map((point) => point.x)),
      y: Math.min(...points.map((point) => point.y)),
      z: Math.min(...points.map((point) => point.z)),
    },
    max: {
      x: Math.max(...points.map((point) => point.x)),
      y: Math.max(...points.map((point) => point.y)),
      z: Math.max(...points.map((point) => point.z)),
    },
  };
}

function bounds2D(features: GeoFeature[]): Bounds2D {
  const points = features.flatMap((feature) => feature.points);
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function summarizeFilteredFeatures(features: GeoFeature[]): string[] {
  const counts = new Map<string, number>();
  for (const feature of features) {
    const key = `${feature.layer} / ${classifyFeature(feature)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }))
    .map(([key, count]) => `${key}: ${count}`);
}

function dedupeClosing(points: Position3[]): Position3[] {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points.at(-1);
  return first && last && first.x === last.x && first.y === last.y && first.z === last.z ? points.slice(0, -1) : points;
}

function layerColor(index: number): string {
  const colors = ["#ffffff", "#4de2b1", "#4da3ff", "#ffd166", "#ff647c", "#b78cff", "#55d6d0"];
  return colors[index % colors.length] ?? "#ffffff";
}

function pushPair(chunks: string[], code: number, value: string | number): void {
  chunks.push(String(code), String(value));
}

function sanitizeLayerName(name: string): string {
  return name.replace(/[<>\\/":;?*|=]/g, "_").slice(0, 255) || "Layer";
}

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
  const source = normalized.length === 3
    ? normalized.split("").map((character) => character + character).join("")
    : normalized;
  const value = Number.parseInt(source, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
}

function baseName(fileName: string): string {
  return fileName.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
}

function formatBounds(bounds: Bounds2D): string {
  return `${bounds.minX},${bounds.minY} - ${bounds.maxX},${bounds.maxY}`;
}

function inferGeoJsonDxfUnits(declaredCrs: string | null): number {
  if (!declaredCrs) return 0;
  return /(?:4326|CRS\s*:?\s*84)/i.test(declaredCrs) ? 0 : 6;
}
