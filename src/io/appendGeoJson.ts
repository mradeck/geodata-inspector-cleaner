import type { GeoDataset } from "../model";
import { normalizeEpsg } from "../geo/mapProjection";
import { inspectDxfDuplicates } from "../duplicates/dxfDuplicates";
import { exportFeaturesAsDxf } from "./exportCleaned";
import { parseDxf } from "./parseDxf";

/** Append imported UTM geometry without normalizing existing CAD entities. */
export function appendGeoJson(existing: GeoDataset, incoming: GeoDataset, workingCrs: string | null): GeoDataset {
  if (incoming.format !== "geojson" || incoming.declaredCrs !== "EPSG:25832") throw new Error("append-format");
  if (normalizeEpsg(workingCrs ?? existing.declaredCrs) !== incoming.declaredCrs) throw new Error("append-crs");
  if (existing.format === "geojson") {
    const used = new Set(existing.features.map((f) => f.id));
    let next = 1;
    return { ...existing, warnings: [...existing.warnings, ...incoming.warnings],
      features: [...existing.features, ...incoming.features.map((feature) => {
        while (used.has(`added-${next}`)) next++;
        const id = `added-${next++}`; used.add(id); return { ...feature, id };
      })] };
  }
  const original = existing.dxfDuplicates;
  if (!original || original.error) throw new Error("append-structure");
  const source = original.source;
  const tags = readTags(source);
  const generatedSource = exportFeaturesAsDxf(incoming.features, incoming.declaredCrs);
  const generated = readTags(generatedSource);
  const newline = source.match(/\r\n|\n|\r/)?.[0] ?? "\n";
  let highest = 0n;
  for (const tag of tags) if ((tag.code === 5 || tag.code === 105) && /^[\da-f]+$/i.test(tag.value)) {
    const handle = BigInt(`0x${tag.value}`); if (handle > highest) highest = handle;
  }
  const nextHandle = () => (++highest).toString(16).toUpperCase();
  const edits: { start: number; end: number; content: string }[] = [];
  const emit = (items: Tag[]) => items.map((t) => `${t.code}${newline}${t.code === 5 ? nextHandle() : t.value}${newline}`).join("");
  const tableStart = tags.findIndex((t, i) => t.code === 0 && t.value === "TABLE" && tags[i + 1]?.value === "LAYER");
  const tableEnd = tags.findIndex((t, i) => i > tableStart && t.code === 0 && t.value === "ENDTAB");
  const entityStart = tags.findIndex((t, i) => t.code === 0 && t.value === "SECTION" && tags[i + 1]?.value === "ENTITIES");
  const entityEnd = tags.findIndex((t, i) => i > entityStart && t.code === 0 && t.value === "ENDSEC");
  if (tableStart < 0 || tableEnd < 0 || entityStart < 0 || entityEnd < 0) throw new Error("append-structure");
  const knownLayers = new Set(tags.slice(tableStart + 2, tableEnd).filter((t) => t.code === 2).map((t) => t.value.toLowerCase()));
  let newLayers = ""; let layerCount = 0;
  for (let i = 0; i < generated.length; i++) {
    if (generated[i]!.code !== 0 || generated[i]!.value !== "LAYER") continue;
    let end = i + 1; while (end < generated.length && generated[end]!.code !== 0) end++;
    const record = generated.slice(i, end);
    const name = record.find((t) => t.code === 2)!.value.toLowerCase();
    if (knownLayers.has(name)) continue;
    knownLayers.add(name); layerCount++;
    // Plot style belongs to the generated document; never copy its external handle.
    newLayers += emit(record.filter((t) => t.code !== 390));
  }
  edits.push({ start: tags[tableEnd]!.start, end: tags[tableEnd]!.start, content: newLayers });
  const countTag = tags.slice(tableStart + 2, tableEnd).find((t) => t.code === 70);
  if (countTag && layerCount) edits.push({ start: countTag.start, end: countTag.end, content: `70${newline}${Number(countTag.value) + layerCount}${newline}` });
  const generatedCheck = inspectDxfDuplicates(generatedSource);
  const added = generatedCheck.entities.map((entity) => emit(entity.tags.map((t) => ({ ...t, value: t.value.trim() })))).join("");
  edits.push({ start: tags[entityEnd]!.start, end: tags[entityEnd]!.start, content: added });
  const seedIndex = tags.findIndex((t) => t.code === 9 && t.value === "$HANDSEED");
  const seed = tags[seedIndex + 1];
  if (seedIndex >= 0 && seed?.code === 5) edits.push({ start: seed.start, end: seed.end, content: `5${newline}${nextHandle()}${newline}` });
  // Extend cached model-space extents without shrinking any existing CAD bounds.
  for (const variable of ["$EXTMIN", "$EXTMAX"]) {
    const start = tags.findIndex((tag) => tag.code === 9 && tag.value === variable);
    if (start < 0) continue;
    for (let i = start + 1; i < tags.length && tags[i]!.code !== 9 && tags[i]!.code !== 0; i++) {
      const tag = tags[i]!;
      const axis = tag.code === 10 ? "x" : tag.code === 20 ? "y" : tag.code === 30 ? "z" : null;
      if (!axis || !Number.isFinite(Number(tag.value))) continue;
      let bound = Number(tag.value);
      for (const feature of incoming.features) for (const point of feature.points) {
        bound = variable === "$EXTMIN" ? Math.min(bound, point[axis]) : Math.max(bound, point[axis]);
      }
      edits.push({ start: tag.start, end: tag.end, content: `${tag.code}${newline}${bound}${newline}` });
    }
  }
  let content = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) content = content.slice(0, edit.start) + edit.content + content.slice(edit.end);
  const result = parseDxf(content, existing.fileName);
  const check = result.dxfDuplicates;
  if (!check || check.error || check.entities.length !== original.entities.length + generatedCheck.entities.length) throw new Error("append-validation");
  for (const [i, before] of original.entities.entries()) {
    const after = check.entities[i]!;
    if (source.slice(before.start, before.end) !== content.slice(after.start, after.end)) throw new Error("append-validation");
  }
  result.declaredCrs = incoming.declaredCrs;
  result.warnings.push(...incoming.warnings);
  return result;
}
interface Tag { code: number; value: string; start: number; end: number }
function readTags(source: string): Tag[] {
  const lines = [...source.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)].filter((m) => m[0].length);
  const tags: Tag[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const a = lines[i]!; const b = lines[i + 1];
    if (!b) throw new Error("append-structure");
    tags.push({ code: Number(a[0].trim()), value: b[0].trim(), start: a.index!, end: b.index! + b[0].length });
  }
  return tags;
}
