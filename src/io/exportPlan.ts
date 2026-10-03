import { pointCompanions, ANNOTATION_TYPES } from "../analysis/pointCompanions";
import { applySingleVertexActions, type SingleVertexAction } from "../repair/singleVertexPolyline";
import { compactDxf } from "./compactDxf";
import { removalDependencies } from "../duplicates/removalDependencies";
import { createEntityRemovalExport, inspectDxfDuplicates } from "../duplicates/dxfDuplicates";
import { createHatchOutlineExport, inspectHatchOutlines } from "../hatches/hatchOutlines";
import type { GeoDataset, SpatialCluster } from "../model";

export interface ExportPlan {
  duplicateIds: ReadonlySet<string>;
  removedFeatureIds: ReadonlySet<string>;
  hatchOutlines: boolean;
  compact?: boolean;
  stripAnnotations?: boolean;
  removedEntityIds?: ReadonlySet<string>;
  singleVertexActions?: ReadonlyMap<string, SingleVertexAction>;
}

/** All choices apply to the unchanged source. Remove first, then generate boundaries
 * only for retained hatches. Existing CAD objects are never normalized to preview geometry. */
export function createPlannedDxf(dataset: GeoDataset, plan: ExportPlan) {
  const source = dataset.dxfDuplicates;
  if (!source || source.error) throw new Error("invalid-dxf");
  if ([...(plan.singleVertexActions?.keys() ?? [])].some(id => !source.entities.some(e=>e.id===id))) throw new Error('repair-selection');
  const duplicateIds = new Set(source.candidates.filter((c) => !c.blocked).map((c) => c.entityId));
  if ([...plan.duplicateIds].some((id) => !duplicateIds.has(id))) throw new Error("invalid-duplicate-selection");
  const featuresByEntity = new Map<string, typeof dataset.features>();
  for (const f of dataset.features) if (f.sourceEntityId) { const list = featuresByEntity.get(f.sourceEntityId) ?? []; list.push(f); featuresByEntity.set(f.sourceEntityId, list); }
  const selected = new Set(plan.duplicateIds);
  for (const id of plan.removedEntityIds ?? []) {
    const e=source.entities.find(e=>e.id===id);
    if(!e) throw new Error('invalid-selection');
    if(!plan.compact && e.protected && !removalDependencies(source,e)) continue;
    selected.add(id);
  }
  const blocked: string[] = [];
  const partial: string[] = [];
  for (const entity of source.entities) {
    const features = featuresByEntity.get(entity.id) ?? [];
    const requested = features.filter((f) => plan.removedFeatureIds.has(f.id));
    if (!requested.length) continue;
    // INSERT + attributes / POLYLINE + vertices must stay atomic.
    if (requested.length !== features.length) { partial.push(entity.handle ?? entity.id); continue; }
    if (!plan.compact && entity.protected && !removalDependencies(source, entity)) { blocked.push(entity.handle ?? entity.id); continue; }
    selected.add(entity.id);
  }
  const companions=pointCompanions(source), removedCompanions:string[]=[], protectedCompanions:string[]=[];
  for(const [id,owners] of companions.links){
    if(!owners.every(owner=>selected.has(owner))||selected.has(id))continue;
    const e=source.entities.find(e=>e.id===id)!;
    if(!plan.compact&&e.protected&&!removalDependencies(source,e)){protectedCompanions.push(id);continue;}
    selected.add(id);removedCompanions.push(id);
  }
  const removal = plan.compact ? (() => {
    let content=source.source;
    const removed=source.entities.filter(e=>selected.has(e.id));
    for(const e of [...removed].reverse())content=content.slice(0,e.start)+content.slice(e.end);
    return {content,removed:removed.map(e=>({id:e.id,handle:e.handle,layer:e.layer,type:e.type})),removedCount:removed.length,keptCount:source.entities.length-removed.length,removedReferenceCount:0,removedOwnedObjectCount:0,repairedReferenceCount:0};
  })() : createEntityRemovalExport(source, selected);
  let content = removal.content;
  const survivors = source.entities.filter(e => !selected.has(e.id));
  const filtered = inspectDxfDuplicates(content);
  const actions = new Map(filtered.entities.map((e,i) => [e.id, plan.singleVertexActions?.get(survivors[i]!.id) ?? 'keep'] as const));
  const repair = applySingleVertexActions(content, actions);
  content = repair.content;
  const remaining = inspectDxfDuplicates(content);
  const check = inspectHatchOutlines(remaining);
  let created: ReturnType<typeof createHatchOutlineExport>["created"] = [];
  if (plan.hatchOutlines && check.error) throw new Error("hatch-unavailable");
  if (plan.hatchOutlines && check.outlines.some((o) => !o.exists)) {
    const result = createHatchOutlineExport(remaining); content = result.content; created = result.created;
  }
  const compact = plan.compact ? compactDxf(content, { stripAnnotations: plan.stripAnnotations }) : null;
  if(compact)content=compact.content;
  const final = inspectDxfDuplicates(content);
  if (final.error || final.entities.length !== removal.keptCount - repair.deleted - repair.reused + created.length - (compact?.removedHatches ?? 0) - (compact?.removedAnnotationEntities ?? 0)) throw new Error("validation");
  const originalRepair=repair.changes.map(c=>({...c,id:survivors[filtered.entities.findIndex(e=>e.id===c.id)]!.id}));
  const previewRemoved=new Set([...removal.removed.map(e=>e.id),...originalRepair.filter(c=>c.action==='delete'||c.action==='reuse-point').map(c=>c.id)]);
  if(plan.stripAnnotations)for(const e of source.entities)if(ANNOTATION_TYPES.has(e.type))previewRemoved.add(e.id);
  return {
    preview: { removedEntityIds: [...previewRemoved], convertedEntityIds:originalRepair.filter(c=>c.action==='convert').map(c=>c.id) },
    content, fileName: dataset.fileName.replace(/\.dxf$/i, "") + (plan.compact ? "-clean.dxf" : "-export.dxf"),
    keptCount: final.entities.length, removedCount: removal.removedCount + repair.deleted + repair.reused + (compact?.removedAnnotationEntities ?? 0),
    audit: { removedCompanions, protectedCompanions, unresolvedCompanions:companions.unresolved, geometryOnly: Boolean(plan.stripAnnotations), removedAnnotations: compact?.removedAnnotations ?? 0, singleVertexRepair: originalRepair, convertedSingleVertices: repair.converted, deletedSingleVertices: repair.deleted, reusedPoints: repair.reused, sourceFile: dataset.fileName, removed: removal.removed, removedIdBufferReferences: removal.removedReferenceCount,
      removedOwnedObjectCount: removal.removedOwnedObjectCount, repairedReferenceCount: removal.repairedReferenceCount,
      removedFeatureCount: removal.removed.reduce((sum, e) => sum + (featuresByEntity.get(e.id)?.length ?? 0), 0) + repair.changes.filter(c=>c.action==='delete'||c.action==='reuse-point').reduce((sum,c)=>{
        const index=filtered.entities.findIndex(e=>e.id===c.id);
        return sum+(index>=0 ? featuresByEntity.get(survivors[index]!.id)?.length ?? 0 : 0);
      },0),
      selectedDuplicateCount: plan.duplicateIds.size, createdOutlines: created, hatchOutlinesEnabled: plan.hatchOutlines,
      skippedHatches: plan.hatchOutlines ? check.skipped : [], protectedObjectsRetained: blocked, partialObjectsRetained: partial,
      replacedHatchCount: compact?.removedHatches ?? 0,
      sourceHatchesRetained: !compact?.removedHatches, exportMode: plan.compact ? "compact-geometry" : "source-preserving-combined" },
  };
}

/** Spatial distance is a finding, not proof of an error: require explicit selection. */
export function defaultAreaRemovalIds(clusters: readonly Pick<SpatialCluster, "isPrimary" | "featureIds">[]): Set<string> {
  void clusters;
  return new Set();
}
