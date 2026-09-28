import { removalDependencies } from "./removalDependencies";
/** Exact source comparison, deliberately independent of the approximated preview geometry. */
export interface DxfSourceEntity {
  id: string;
  type: string;
  handle: string | null;
  layer: string;
  start: number;
  end: number;
  tags: DxfTag[];
  protected: boolean;
}
interface DxfTag { code: number; value: string; start: number; end: number }
export interface DxfDuplicateCandidate {
  id: string;
  kind: "same-layer" | "cross-layer";
  keeperId: string;
  entityId: string;
  groupId: string;
  blocked: boolean;
}
export interface DxfDuplicateCheck {
  source: string;
  entities: DxfSourceEntity[];
  candidates: DxfDuplicateCandidate[];
  error: "structure" | "encoding" | null;
  removableReferences: DxfTag[];
}

/** Handles are identity, not content. Internal owner references are canonicalized,
 * while external references, properties, coordinate spelling/order and Z stay exact. */
function signature(entity: DxfSourceEntity, ignoreLayer: boolean): string {
  const localHandles = new Map<string, string>();
  for (const tag of entity.tags) {
    if (tag.code === 5) localHandles.set(tag.value.toUpperCase(), `local-${localHandles.size}`);
  }
  return JSON.stringify(entity.tags
    .filter((tag) => tag.code !== 5 && (!ignoreLayer || tag.code !== 8))
    .map(({ code, value }) => [code, code === 330 ? localHandles.get(value.toUpperCase()) ?? value : value]));
}

export function inspectDxfDuplicates(source: string): DxfDuplicateCheck {
  const result: DxfDuplicateCheck = { source, entities: [], candidates: [], error: null, removableReferences: [] };
  if (source.includes("\ufffd")) return { ...result, error: "encoding" };
  const lines = [...source.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)].filter((m) => m[0].length);
  if (lines.length % 2) return { ...result, error: "structure" };
  const tags: DxfTag[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const codeLine = lines[i]!;
    const valueLine = lines[i + 1]!;
    const codeString = codeLine[0].trim();
    if (!/^\d+$/.test(codeString)) return { ...result, error: "structure" };
    tags.push({ code: Number(codeString), value: valueLine[0].replace(/[\r\n]+$/, ""),
      start: codeLine.index!, end: valueLine.index! + valueLine[0].length });
  }
  const is = (i: number, code: number, value: string) => tags[i]?.code === code && tags[i]?.value.trim() === value;
  if (!is(tags.length - 1, 0, "EOF")) return { ...result, error: "structure" };
  let inSection = false;
  for (let i = 0; i < tags.length; i++) {
    if (is(i, 0, "SECTION")) {
      if (inSection || tags[i + 1]?.code !== 2) return { ...result, error: "structure" };
      inSection = true;
    } else if (is(i, 0, "ENDSEC")) {
      if (!inSection) return { ...result, error: "structure" };
      inSection = false;
    }
  }
  if (inSection) return { ...result, error: "structure" };
  const start = tags.findIndex((_, i) => is(i, 0, "SECTION") && is(i + 1, 2, "ENTITIES"));
  const end = tags.findIndex((_, i) => i > start + 1 && is(i, 0, "ENDSEC"));
  if (start < 0 || end < 0) return { ...result, error: "structure" };
  const nextMarker = (i: number) => { while (i < end && tags[i]?.code !== 0) i++; return i; };
  let cursor = start + 2;
  while (cursor < end) {
    const marker = tags[cursor]!;
    if (marker.code !== 0) return { ...result, error: "structure" };
    const type = marker.value.trim();
    let next = nextMarker(cursor + 1);
    const header = tags.slice(cursor, next);
    const hasChildren = type === "POLYLINE" || (type === "INSERT" && header.some((t) => t.code === 66 && t.value.trim() === "1"));
    if (hasChildren) {
      const child = type === "POLYLINE" ? "VERTEX" : "ATTRIB";
      while (next < end && is(next, 0, child)) next = nextMarker(next + 1);
      if (!is(next, 0, "SEQEND")) return { ...result, error: "structure" };
      next = nextMarker(next + 1);
    }
    if (["VERTEX", "ATTRIB", "SEQEND", "SECTION"].includes(type)) return { ...result, error: "structure" };
    result.entities.push({ id: `entity-${result.entities.length + 1}`, type,
      handle: header.find((t) => t.code === 5)?.value.trim() ?? null,
      layer: header.find((t) => t.code === 8)?.value ?? "0",
      start: marker.start, end: tags[next - 1]!.end, tags: tags.slice(cursor, next), protected: false });
    cursor = next;
  }
  // Deleting externally referenced handles could corrupt dictionaries/reactors/etc.
  // Such candidates remain visible, but cannot be selected for deletion.
  const ownerByHandle = new Map<string, DxfSourceEntity>();
  for (const entity of result.entities) for (const tag of entity.tags) {
    if (tag.code === 5) {
      const handle = tag.value.trim().toUpperCase();
      const previous = ownerByHandle.get(handle);
      if (previous) { previous.protected = true; entity.protected = true; }
      ownerByHandle.set(handle, entity);
    }
  }
  // Only IDBUFFER member pointers are a documented, safely editable list.
  // Owners, reactors, unknown subclasses and all other objects stay protected.
  let section = ""; let objectType = ""; let subclass = ""; let depth = 0;
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]!;
    if (tag.code === 0) {
      objectType = tag.value.trim(); subclass = ""; depth = 0;
      if (objectType === "SECTION") section = tags[i + 1]?.value.trim() ?? "";
      if (objectType === "ENDSEC") section = "";
    }
    if (tag.code === 102) { if (tag.value.trim().startsWith("{")) depth++; else if (tag.value.trim() === "}") depth--; }
    if (tag.code === 100 && depth === 0) subclass = tag.value.trim();
    if (section === "OBJECTS" && objectType === "IDBUFFER" && subclass === "AcDbIdBuffer" && depth === 0 && tag.code === 330) {
      result.removableReferences.push(tag);
      continue;
    }
    if ((tag.code >= 320 && tag.code <= 369) || tag.code === 390 || tag.code === 480 || tag.code === 481 || tag.code === 1005) {
      const target = ownerByHandle.get(tag.value.trim().toUpperCase());
      if (target && (tag.start < target.start || tag.start >= target.end)) target.protected = true;
    }
  }
  const geometryGroups = new Map<string, DxfSourceEntity[]>();
  for (const entity of result.entities) {
    const key = signature(entity, true);
    const members = geometryGroups.get(key) ?? [];
    members.push(entity); geometryGroups.set(key, members);
  }
  for (const members of geometryGroups.values()) {
    if (members.length < 2) continue;
    const groupId = members[0]!.id;
    const exact = new Map<string, DxfSourceEntity>();
    let first: DxfSourceEntity | undefined;
    for (const entity of members) {
      const key = signature(entity, false);
      const keeper = exact.get(key);
      if (keeper) {
        result.candidates.push({ id: entity.id, kind: "same-layer", keeperId: keeper.id,
          entityId: entity.id, groupId, blocked: entity.protected });
      } else {
        exact.set(key, entity);
        if (first) result.candidates.push({ id: entity.id, kind: "cross-layer", keeperId: first.id,
          entityId: entity.id, groupId, blocked: entity.protected });
        else first = entity;
      }
    }
  }
  return result;
}

export function duplicateCounts(check: DxfDuplicateCheck) {
  return {
    sameLayer: check.candidates.filter((c) => c.kind === "same-layer").length,
    crossLayer: check.candidates.filter((c) => c.kind === "cross-layer").length,
  };
}

export function createDuplicateExport(check: DxfDuplicateCheck, selected: ReadonlySet<string>) {
  if (check.error || selected.size === 0) throw new Error("invalid-selection");
  const candidates = new Map(check.candidates.map((c) => [c.entityId, c]));
  for (const id of selected) {
    const candidate = candidates.get(id);
    if (!candidate || candidate.blocked) throw new Error("invalid-selection");
  }
  const output = createEntityRemovalExport(check, selected);
  return { ...output, removed: output.removed.map((e) => ({ ...e, kind: candidates.get(e.id)!.kind })) };
}

/** Shared source-preserving removal for the combined export. */
export function createEntityRemovalExport(check: DxfDuplicateCheck, selected: ReadonlySet<string>) {
  if (check.error || [...selected].some((id) => !check.entities.some((e) => e.id === id))) throw new Error("invalid-selection");
  const kept = check.entities.filter((e) => !selected.has(e.id));
  const removed = check.entities.filter((e) => selected.has(e.id));
  const dependencies = removed.filter(e => e.protected).map(e => removalDependencies(check, e));
  if (dependencies.some(d => !d)) throw new Error("invalid-selection");
  const metadataEdits = dependencies.flatMap(d => d!.edits);
  const removedHandles = new Set(removed.flatMap((e) => e.tags.filter((t) => t.code === 5).map((t) => t.value.trim().toUpperCase())));
  for (const dependency of dependencies) for (const handle of dependency!.handles) removedHandles.add(handle);
  const removedReferences = check.removableReferences.filter((t) => removedHandles.has(t.value.trim().toUpperCase()));
  const ranges: { start: number; end: number; replacement?: string }[] = [...removed, ...removedReferences, ...metadataEdits].sort((a, b) => a.start - b.start || b.end - a.end);
  const pieces: string[] = [];
  let cursor = 0;
  for (const range of ranges) { if (range.end <= cursor) continue; if (range.start < cursor) throw new Error("overlapping-edits"); pieces.push(check.source.slice(cursor, range.start), range.replacement ?? ""); cursor = range.end; }
  pieces.push(check.source.slice(cursor));
  const content = pieces.join("");
  const reparsed = inspectDxfDuplicates(content);
  if (reparsed.error || reparsed.entities.length !== kept.length || reparsed.entities.some((e, i) =>
    content.slice(e.start, e.end) !== check.source.slice(kept[i]!.start, kept[i]!.end))) throw new Error("validation");
  if (reparsed.removableReferences.some((t) => removedHandles.has(t.value.trim().toUpperCase()))) throw new Error("validation");
  return { content, removedOwnedObjectCount: dependencies.reduce((sum, d) => sum + d!.objectCount, 0), repairedReferenceCount: metadataEdits.length, removedReferenceCount: removedReferences.length, keptCount: kept.length, removedCount: removed.length,
    removed: removed.map((e) => ({ id: e.id, handle: e.handle, layer: e.layer, type: e.type })) };
}
