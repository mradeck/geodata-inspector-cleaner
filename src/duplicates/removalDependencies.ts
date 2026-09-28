import type { DxfDuplicateCheck, DxfSourceEntity } from './dxfDuplicates';

interface Tag { code: number; value: string; start: number; end: number }
interface RecordData { section: string; type: string; handle: string; owner: string; tags: Tag[]; start: number; end: number }
export interface SourceEdit { start: number; end: number; replacement?: string }
const cache = new WeakMap<DxfDuplicateCheck, RecordData[]>();
const key = (value: string) => value.trim().toUpperCase();
const pointer = (code: number) => (code >= 320 && code <= 369) || [390, 480, 481, 1005].includes(code);
function records(check: DxfDuplicateCheck): RecordData[] {
  const cached = cache.get(check); if (cached) return cached;
  const lines = [...check.source.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)].filter(m => m[0].length);
  const tags: Tag[] = [];
  for (let i = 0; i < lines.length; i += 2) tags.push({ code: Number(lines[i]![0].trim()), value: lines[i + 1]![0].trim(), start: lines[i]!.index!, end: lines[i + 1]!.index! + lines[i + 1]![0].length });
  const result: RecordData[] = []; let section = '';
  for (let i = 0; i < tags.length;) {
    let end = i + 1; while (end < tags.length && tags[end]!.code !== 0) end++;
    const group = tags.slice(i, end); const type = group[0]!.value;
    if (type === 'SECTION') section = group[1]?.value ?? '';
    let owner = ''; let depth = 0;
    for (const t of group) {
      if (t.code === 102) { if (t.value.startsWith('{')) depth++; else if (t.value === '}') depth--; }
      if (t.code === 100 && !depth) break;
      if (t.code === 330 && !depth) owner = key(t.value);
    }
    result.push({ section, type, handle: key(group.find(t => t.code === 5 || t.code === 105)?.value ?? ''), owner, tags: group, start: group[0]!.start, end: group.at(-1)!.end });
    if (type === 'ENDSEC') section = '';
    i = end;
  }
  cache.set(check, result); return result;
}

/** Delete owned extension data and repair only explicitly understood bookkeeping links.
 * Unknown incoming references or ambiguous identities still block the whole entity. */
export function removalDependencies(check: DxfDuplicateCheck, entity: DxfSourceEntity): { edits: SourceEdit[]; handles: Set<string>; objectCount: number } | null {
  const all = records(check);
  const handles = new Set(entity.tags.filter(t => t.code === 5).map(t => key(t.value)));
  const owned = new Set<RecordData>();
  // Follow ownership, never outgoing pointers to shared resources (layers, scales, blocks).
  let added = true;
  while (added) {
    added = false;
    for (const r of all) if (r.section === 'OBJECTS' && r.owner && handles.has(r.owner) && !owned.has(r)) {
      owned.add(r); if (r.handle) handles.add(r.handle); added = true;
    }
  }
  const deleted = (r: RecordData) => owned.has(r) || (r.start >= entity.start && r.end <= entity.end);
  const definitions = all.filter(r => handles.has(r.handle));
  if ([...handles].some(h => definitions.filter(r => r.handle === h).length !== 1)) return null;
  const edits: SourceEdit[] = [...owned].map(r => ({ start: r.start, end: r.end }));
  const idBufferOffsets = new Set(check.removableReferences.map(t => t.start));
  for (const r of all) {
    if (deleted(r)) continue;
    let subclass = ''; let depth = 0; let appGroup = '';
    for (let i = 0; i < r.tags.length; i++) {
      const t = r.tags[i]!;
      if (t.code === 102) { if (t.value.startsWith('{')) { depth++; if (depth === 1) appGroup = t.value; } else if (t.value === '}') { depth--; if (!depth) appGroup = ''; } }
      if (t.code === 100 && !depth) subclass = t.value;
      if (!pointer(t.code) || !handles.has(key(t.value))) continue;
      if (!depth && r.section === 'OBJECTS' && r.type === 'FIELDLIST' && subclass === 'AcDbIdSet' && t.code === 330) { edits.push(t); continue; }
      if (idBufferOffsets.has(t.start)) { edits.push(t); continue; }
      if ((depth === 0 || (depth === 1 && appGroup === '{BLKREFS')) && r.section === 'TABLES' && r.type === 'BLOCK_RECORD' && subclass === 'AcDbBlockTableRecord' && t.code === 331 && entity.type === 'INSERT' && key(t.value) === key(entity.handle ?? '') && r.tags.find(t => t.code === 2)?.value === entity.tags.find(t => t.code === 2)?.value) { edits.push(t); continue; }
      if (!depth && r.section === 'OBJECTS' && r.type === 'SORTENTSTABLE' && subclass === 'AcDbSortentsTable' && t.code === 331 && r.tags[i + 1]?.code === 5) { edits.push({ start: t.start, end: r.tags[i + 1]!.end }); continue; }
      if (!depth && r.section === 'OBJECTS' && r.type === 'LAYOUT' && subclass === 'AcDbLayout' && t.code === 331 && entity.type === 'VIEWPORT') {
        const raw = check.source.slice(t.start, t.end); const eol = raw.includes('\r\n') ? '\r\n' : '\n';
        edits.push({ start: t.start, end: t.end, replacement: `331${eol}0${eol}` }); continue;
      }
      // AutoCAD Map's named block hierarchy index is a list of INSERT soft pointers.
      const indexOwner = all.find(o => o.handle === r.owner && o.type === 'DICTIONARY');
      const namedIndex = indexOwner?.tags.some((x, n) => x.code === 3 && x.value === 'ASEBlockHierarchyIndexRecord' && indexOwner.tags[n + 1]?.code === 350 && key(indexOwner.tags[n + 1]!.value) === r.handle);
      if (!depth && r.section === 'OBJECTS' && r.type === 'XRECORD' && subclass === 'AcDbXrecord' && t.code === 330 && namedIndex && entity.type === 'INSERT' && key(t.value) === key(entity.handle ?? '') && r.tags.slice(r.tags.findIndex(x => x.code === 100 && x.value === 'AcDbXrecord') + 1).every(x => x.code === 280 || x.code === 330)) { edits.push(t); continue; }
      return null;
    }
  }
  return { edits, handles, objectCount: owned.size };
}
