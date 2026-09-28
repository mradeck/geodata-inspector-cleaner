import { createEntityRemovalExport, inspectDxfDuplicates } from "../duplicates/dxfDuplicates";
import { createHatchOutlineExport, inspectHatchOutlines } from "../hatches/hatchOutlines";
import type { GeoDataset, SpatialCluster } from "../model";

export interface ExportPlan {
  duplicateIds: ReadonlySet<string>;
  removedFeatureIds: ReadonlySet<string>;
  hatchOutlines: boolean;
}

/** All choices apply to the unchanged source. Remove first, then generate boundaries
 * only for retained hatches. Existing CAD objects are never normalized to preview geometry. */
export function createPlannedDxf(dataset: GeoDataset, plan: ExportPlan) {
  const source = dataset.dxfDuplicates;
  if (!source || source.error) throw new Error("invalid-dxf");
  const duplicateIds = new Set(source.candidates.filter((c) => !c.blocked).map((c) => c.entityId));
  if ([...plan.duplicateIds].some((id) => !duplicateIds.has(id))) throw new Error("invalid-duplicate-selection");
  const featuresByEntity = new Map<string, typeof dataset.features>();
  for (const f of dataset.features) if (f.sourceEntityId) { const list = featuresByEntity.get(f.sourceEntityId) ?? []; list.push(f); featuresByEntity.set(f.sourceEntityId, list); }
  const selected = new Set(plan.duplicateIds);
  const blocked: string[] = [];
  const partial: string[] = [];
  for (const entity of source.entities) {
    const features = featuresByEntity.get(entity.id) ?? [];
    const requested = features.filter((f) => plan.removedFeatureIds.has(f.id));
    if (!requested.length) continue;
    // INSERT + attributes / POLYLINE + vertices must stay atomic.
    if (requested.length !== features.length) { partial.push(entity.handle ?? entity.id); continue; }
    if (entity.protected) { blocked.push(entity.handle ?? entity.id); continue; }
    selected.add(entity.id);
  }
  const removal = createEntityRemovalExport(source, selected);
  let content = removal.content;
  const remaining = inspectDxfDuplicates(content);
  const check = inspectHatchOutlines(remaining);
  let created: ReturnType<typeof createHatchOutlineExport>["created"] = [];
  if (plan.hatchOutlines && check.error) throw new Error("hatch-unavailable");
  if (plan.hatchOutlines && check.outlines.some((o) => !o.exists)) {
    const result = createHatchOutlineExport(remaining); content = result.content; created = result.created;
  }
  const final = inspectDxfDuplicates(content);
  if (final.error || final.entities.length !== removal.keptCount + created.length) throw new Error("validation");
  return {
    content, fileName: dataset.fileName.replace(/\.dxf$/i, "") + "-export.dxf",
    keptCount: final.entities.length, removedCount: removal.removedCount,
    audit: { sourceFile: dataset.fileName, removed: removal.removed, removedIdBufferReferences: removal.removedReferenceCount,
      selectedDuplicateCount: plan.duplicateIds.size, createdOutlines: created, hatchOutlinesEnabled: plan.hatchOutlines,
      skippedHatches: plan.hatchOutlines ? check.skipped : [], protectedObjectsRetained: blocked, partialObjectsRetained: partial,
      sourceHatchesRetained: true, exportMode: "source-preserving-combined" },
  };
}

/** User default: retain the main area; preselect every detected outside area. */
export function defaultAreaRemovalIds(clusters: readonly Pick<SpatialCluster, "isPrimary" | "featureIds">[]): Set<string> {
  return new Set(clusters.filter((cluster) => !cluster.isPrimary).flatMap((cluster) => cluster.featureIds));
}
