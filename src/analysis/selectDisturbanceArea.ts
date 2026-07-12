import type { Bounds2D, InspectionReport } from "../model";
import { mergeBounds } from "./statistics";

export interface DisturbanceAreaSelection {
  featureIds: Set<string>;
  bounds: Bounds2D;
  assessment: "recommended-removal" | "review";
}

/**
 * Liefert den separat zu prüfenden Nicht-Hauptbereich, ohne aus einer
 * mehrdeutigen Clusterwahl automatisch eine Löschentscheidung abzuleiten.
 */
export function selectDisturbanceArea(report: InspectionReport): DisturbanceAreaSelection | null {
  const remoteClusters = report.clusters.filter((cluster) => !cluster.isPrimary);
  if (remoteClusters.length === 0) return null;

  const hasRemovalRecommendation = report.recommendedRemovalIds.size > 0;
  const selectedClusters = hasRemovalRecommendation
    ? remoteClusters.filter((cluster) => cluster.featureIds.some((id) => report.recommendedRemovalIds.has(id)))
    : remoteClusters;
  const bounds = mergeBounds(selectedClusters.map((cluster) => cluster.bounds));
  if (!bounds) return null;

  return {
    featureIds: new Set(selectedClusters.flatMap((cluster) => cluster.featureIds)),
    bounds,
    assessment: hasRemovalRecommendation ? "recommended-removal" : "review",
  };
}
