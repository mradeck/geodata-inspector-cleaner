import { inspectDataset } from "../analysis/inspectDataset";
import { classifyFeature, filterFeatures, type FeatureFilterSelection } from "../analysis/layerFilter";
import type { Bounds2D, GeoDataset, GeoFeature, GeoLayerMetadata, InspectionReport, Position3, SourceFormat } from "../model";
import { exportNormalizedDxf, type DxfAcadVersion } from "./dxfNormalizedExporter";
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
  coveredHatchFeatureCount: number;
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
  coveredHatchFeatureCount: number;
  filterRemovedByLayerAndType: string[];
  sourceFormat: SourceFormat;
  outputFormat: SourceFormat;
}

export interface CleanedExportOptions {
  selectionIds?: ReadonlySet<string>;
  featureFilterSelection?: FeatureFilterSelection;
  outputFormat?: SourceFormat;
  /** Erlaubt eine reine Formatkonvertierung, auch wenn kein Feature entfernt wird. */
  allowUnchangedOutput?: boolean;
  /** DXF-Zielformat; AC1015 bleibt der OEM-kompatible Default. */
  acadVersion?: DxfAcadVersion;
  /** CRS-Hinweis aus der Analysevorgabe; Koordinaten werden nicht reprojiziert. */
  coordinateSystemLabel?: string | null;
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
  if (!options.selectionIds && report.primarySelection !== "manual") throw new CleanerError("primary-not-confirmed");
  const primary = report.clusters.find((cluster) => cluster.isPrimary);
  if (!primary) throw new CleanerError("no-primary");
  const keepIds = options.selectionIds ?? new Set(primary.featureIds);
  const primaryFeatures = dataset.features.filter((feature) => keepIds.has(feature.id));
  const selectedFeatures = options.featureFilterSelection
    ? filterFeatures(primaryFeatures, options.featureFilterSelection)
    : primaryFeatures;
  const outputFormat = options.outputFormat ?? dataset.format;
  const keptFeatures = outputFormat === "dxf" ? omitCoveredHatchPreviews(selectedFeatures) : selectedFeatures;
  const coveredHatchFeatureCount = selectedFeatures.length - keptFeatures.length;
  if (keptFeatures.length === 0) throw new CleanerError("nothing-kept");
  const spatialRemovedFeatureCount = dataset.features.length - primaryFeatures.length;
  const filterRemovedFeatures = primaryFeatures.filter((feature) => !selectedFeatures.includes(feature));
  const filterRemovedFeatureCount = filterRemovedFeatures.length;
  const removedFeatureCount = dataset.features.length - keptFeatures.length;
  if (removedFeatureCount === 0 && !options.allowUnchangedOutput) throw new CleanerError("nothing-to-remove");
  const outputBounds = bounds2D(keptFeatures);
  const coordinateSystemLabel = options.coordinateSystemLabel ?? dataset.declaredCrs;

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
    coveredHatchFeatureCount,
    filterRemovedByLayerAndType: summarizeFilteredFeatures(filterRemovedFeatures),
    sourceFormat: dataset.format,
    outputFormat,
  };
  const content = outputFormat === "dxf"
    ? exportFeaturesAsDxf(
        keptFeatures,
        coordinateSystemLabel,
        audit,
        dataset.layerMetadata,
        dataset.format === "geojson" ? inferGeoJsonDxfUnits(coordinateSystemLabel) : 6,
        options.acadVersion,
      )
    : exportFeaturesAsGeoJson(keptFeatures, coordinateSystemLabel, audit);
  const reparsed = outputFormat === "dxf"
    ? parseDxf(content, outputName)
    : parseGeoJson(content, outputName);
  validateReimport(reparsed, keptFeatures.length, outputBounds, Boolean(options.selectionIds));

  return {
    content,
    fileName: outputName,
    mimeType: outputFormat === "dxf" ? "application/dxf;charset=utf-8" : "application/geo+json;charset=utf-8",
    keptFeatureCount: keptFeatures.length,
    removedFeatureCount,
    spatialRemovedFeatureCount,
    filterRemovedFeatureCount,
    coveredHatchFeatureCount,
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
  acadVersion: DxfAcadVersion = "AC1015",
): string {
  const comments = [
    "Normalized by geodata-inspector-cleaner using the Pointcloud Manager DXF export strategy",
    `DXF target format: ${acadVersion}`,
  ];
  if (audit) {
    comments.push(
      `Cleaner source: ${audit.sourceFile}`,
      `Cleaner retained features: ${audit.keptFeatureCount}`,
      `Cleaner removed features: ${audit.removedFeatureCount}`,
      `Cleaner spatially removed features: ${audit.spatialRemovedFeatureCount}`,
      `Cleaner object-filter removed features: ${audit.filterRemovedFeatureCount}`,
      `Cleaner hatch previews covered by selected outlines: ${audit.coveredHatchFeatureCount}`,
      `Cleaner confirmed main bounds: ${formatBounds(audit.primaryBounds)}`,
      `Cleaner output bounds: ${formatBounds(audit.outputBounds)}`,
      `Cleaner format conversion: ${audit.sourceFormat} -> ${audit.outputFormat}`,
      ...audit.filterRemovedByLayerAndType.map((entry) => `Cleaner object filter: ${entry}`),
    );
  }
  if (insUnits === 0) comments.push("Coordinate values preserved without reprojection; DXF units are Unitless");
  return exportNormalizedDxf(features, {
    acadVersion,
    insUnits: insUnits === 6 ? 6 : 0,
    coordinateSystemLabel,
    comments,
    layerMetadata,
  });
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
      coveredHatchFeatureCount: audit.coveredHatchFeatureCount,
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

function validateReimport(dataset: GeoDataset, expectedFeatureCount: number, expectedBounds: Bounds2D, allowMultipleClusters = false): void {
  if (dataset.features.length !== expectedFeatureCount) throw new CleanerError("validation-count");
  const report = inspectDataset(dataset);
  if (!allowMultipleClusters && report.clusters.length !== 1) throw new CleanerError("validation-clusters");
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

/** Only suppress HATCH previews if every ring is already covered by a selected
 * closed polyline on the same layer. Never deduplicate unrelated CAD entities.
 * Comparison is exact and ordered; no spatial tolerance or rounded coordinates. */
export function omitCoveredHatchPreviews(features: GeoFeature[]): GeoFeature[] {
  const key = (layer: string, points: Position3[]) => JSON.stringify([layer, dedupeClosing(points).map((p) => [p.x, p.y, p.z])]);
  const outlines = new Set(features.filter((f) => f.kind === "polygon" && ["LWPOLYLINE", "POLYLINE"].includes(f.sourceType)).map((f) => key(f.layer, f.points)));
  return features.filter((f) => !(f.sourceType === "HATCH" && f.hatchBoundaryPoints?.length && f.hatchBoundaryPoints.every((ring) => outlines.has(key(f.layer, ring)))));
}
