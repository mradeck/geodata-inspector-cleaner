import { assessClustersForMap } from "../geo/mapProjection";
import type { GeoDataset, InspectionConfig, InspectionReport } from "../model";
import { inspectDataset } from "./inspectDataset";

export interface AnalyzeDatasetOptions {
  analysisCrs?: string | null;
  preferredPrimaryFeatureId?: string | null;
}

/**
 * Verbindet die formatneutrale Clusteranalyse mit einer vorsichtigen
 * CRS-Plausibilitätswahl. Nur eine explizite Benutzervorgabe oder ein
 * deklariertes CRS und genau ein kartierbarer Cluster dürfen die reine
 * Größenheuristik als Kandidat überstimmen.
 */
export function analyzeDataset(
  dataset: GeoDataset,
  overrides: Partial<InspectionConfig> = {},
  options: AnalyzeDatasetOptions = {},
): InspectionReport {
  if (options.preferredPrimaryFeatureId) {
    return inspectDataset(dataset, overrides, {
      analysisCrs: options.analysisCrs,
      preferredPrimaryFeatureId: options.preferredPrimaryFeatureId,
      preferredPrimarySource: "manual",
    });
  }

  const initial = inspectDataset(dataset, overrides, { analysisCrs: options.analysisCrs });
  if (initial.clusters.length < 2) return initial;

  const mapReport = assessClustersForMap(initial);
  if (mapReport.source !== "input" && mapReport.source !== "declared") return initial;
  const mappable = mapReport.clusters.filter((cluster) => cluster.status === "mappable");
  if (mappable.length !== 1) return initial;

  const preferredPrimaryFeatureId = mappable[0]?.featureIds[0];
  if (!preferredPrimaryFeatureId || mappable[0]?.clusterId === initial.primaryClusterId) return initial;

  return inspectDataset(dataset, overrides, {
    analysisCrs: options.analysisCrs,
    preferredPrimaryFeatureId,
    preferredPrimarySource: "crs",
  });
}
