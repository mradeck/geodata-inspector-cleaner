import type { GeoDataset, GeoFeature, GeoLayerMetadata } from "../model";

/** An die DXF-Importmatrix des Pointcloud-Managers angelehnte Geometrietypen. */
export type FilterShapeType = "point" | "line" | "polyline" | "area" | "annotation" | "block";

export const FILTER_SHAPE_TYPES: readonly FilterShapeType[] = ["point", "line", "polyline", "area", "annotation", "block"];

export interface LayerObjectSummary {
  layerName: string;
  metadata: GeoLayerMetadata;
  counts: Record<FilterShapeType, number>;
  total: number;
}

/** Beschreibt die Layer×Typ-Kombinationen, die im Cleaning-Export bleiben. */
export type FeatureFilterSelection = Set<string>;

export function selectionKey(layerName: string, type: FilterShapeType): string {
  return JSON.stringify([layerName, type]);
}

export function classifyFeature(feature: GeoFeature): FilterShapeType {
  if (['TEXT','MTEXT','ATTRIB','ATTDEF','DIMENSION','LEADER','MLEADER'].includes(feature.sourceType)) return 'annotation';
  if (feature.sourceType === 'INSERT') return 'block';
  if (['LWPOLYLINE','POLYLINE'].includes(feature.sourceType) && feature.points.length===1) return 'polyline';
  if (feature.kind === "point" || feature.kind === "anchor" || feature.points.length === 1) return "point";
  if (feature.kind === "polygon") return "area";
  if (feature.kind === "line" || feature.points.length === 2) return "line";
  return "polyline";
}

export function summarizeLayers(dataset: GeoDataset): LayerObjectSummary[] {
  const metadataByName = new Map((dataset.layerMetadata ?? []).map((metadata) => [metadata.name, metadata]));
  const summaries = new Map<string, LayerObjectSummary>();
  for (const feature of dataset.features) {
    let summary = summaries.get(feature.layer);
    if (!summary) {
      summary = {
        layerName: feature.layer,
        metadata: metadataByName.get(feature.layer) ?? fallbackMetadata(feature.layer),
        counts: { point: 0, line: 0, polyline: 0, area: 0, annotation:0, block:0 },
        total: 0,
      };
      summaries.set(feature.layer, summary);
    }
    summary.counts[classifyFeature(feature)] += 1;
    summary.total += 1;
  }
  return [...summaries.values()].sort((left, right) =>
    left.layerName.localeCompare(right.layerName, undefined, { numeric: true, sensitivity: "base" }),
  );
}

/** Retain every category: object type alone is never evidence of an error. */
export function buildDefaultSelection(summaries: LayerObjectSummary[]): FeatureFilterSelection {
  const selection: FeatureFilterSelection = new Set();
  for (const summary of summaries) {
    for (const type of FILTER_SHAPE_TYPES) {
      if (summary.counts[type] > 0) selection.add(selectionKey(summary.layerName, type));
    }
  }
  return selection;
}

export function filterFeatures(features: GeoFeature[], selection: FeatureFilterSelection): GeoFeature[] {
  return features.filter((feature) => selection.has(selectionKey(feature.layer, classifyFeature(feature))));
}

export function countSelected(features: GeoFeature[], selection: FeatureFilterSelection): number {
  return filterFeatures(features, selection).length;
}

function fallbackMetadata(name: string): GeoLayerMetadata {
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
