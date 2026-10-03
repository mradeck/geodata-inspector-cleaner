import { inspectDxfDuplicates, type DxfDuplicateCheck, type DxfSourceEntity } from '../duplicates/dxfDuplicates';

type XYZ = [number, number, number];
export type RepairBlockReason = 'referenced' | 'coordinates' | 'vertex-count' | 'extrusion' | 'no-point-copy' | 'geometry';
export interface SingleVertexFinding {
  id: string; handle: string | null; layer: string; xyz: XYZ | null;
  pointCopies: Array<{ id: string; handle: string | null; layer: string }>;
  blocked: RepairBlockReason | null;
}
export interface SingleVertexCheck {
  source: string;
  findings: SingleVertexFinding[];
  error: 'encoding' | 'structure' | null;
}
function number(entity: DxfSourceEntity, code: number, fallback?: number): number | null {
  const tags = entity.tags.filter(t => t.code === code);
  if (!tags.length) return fallback ?? null;
  if (tags.length !== 1 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(tags[0]!.value.trim())) return null;
  const n = Number(tags[0]!.value.trim()); return Number.isFinite(n) ? n : null;
}
function xyz(entity: DxfSourceEntity): XYZ | null {
  const x = number(entity, 10), y = number(entity, 20), z = number(entity, entity.type === 'POINT' ? 30 : 38, 0);
  return x === null || y === null || z === null ? null : [x, y, z];
}
function standardExtrusion(e: DxfSourceEntity): boolean {
  return number(e, 210, 0) === 0 && number(e, 220, 0) === 0 && number(e, 230, 1) === 1;
}
function space(e: DxfSourceEntity): string {
  return JSON.stringify([number(e, 67, 0), e.tags.find(t => t.code === 410)?.value.trim() ?? '']);
}
/** Index all incoming pointers, including IDBUFFER members: the surgical repair
 * must not rewrite metadata or borrow the cleaner's permissive reference rules. */
function references(source: string): Map<string, number[]> {
  const result = new Map<string, number[]>();
  const lines = [...source.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)].filter(m => m[0].length);
  for (let i = 0; i < lines.length; i += 2) {
    const code = Number(lines[i]![0].trim());
    if (!((code >= 320 && code <= 369) || (code >= 390 && code <= 399) || [480, 481, 1005].includes(code))) continue;
    const key = lines[i + 1]![0].trim().toUpperCase();
    const offsets = result.get(key) ?? []; offsets.push(lines[i]!.index!); result.set(key, offsets);
  }
  return result;
}
/** Findings use original ENTITIES tags even if the preview parser skips a line. */
export function inspectSingleVertexPolylines(source: string, checked?: DxfDuplicateCheck): SingleVertexCheck {
  const result: SingleVertexCheck = { source, findings: [], error: null };
  if (/[^\x00-\x7f]/.test(source)) return { ...result, error: 'encoding' };
  const check = checked?.source === source ? checked : inspectDxfDuplicates(source);
  if (check.error) return { ...result, error: check.error };
  const incoming = references(source);
  const pointIndex = new Map<string, SingleVertexFinding['pointCopies']>();
  for (const e of check.entities) {
    const position = e.type === 'POINT' && standardExtrusion(e) && number(e, 39, 0) === 0 ? xyz(e) : null;
    if (!position) continue;
    const key = space(e) + JSON.stringify(position); const copies = pointIndex.get(key) ?? [];
    copies.push({ id: e.id, handle: e.handle, layer: e.layer }); pointIndex.set(key, copies);
  }
  for (const e of check.entities) {
    if (e.type !== 'LWPOLYLINE' || e.tags.filter(t => t.code === 10).length !== 1) continue;
    const position = xyz(e);
    const copies = position ? pointIndex.get(space(e) + JSON.stringify(position)) ?? [] : [];
    let blocked: RepairBlockReason | null = null;
    const external = e.handle && incoming.get(e.handle.trim().toUpperCase())?.some(offset => offset < e.start || offset >= e.end);
    if (e.protected || external) blocked = 'referenced';
    else if (number(e, 90) !== 1) blocked = 'vertex-count';
    else if (!standardExtrusion(e)) blocked = 'extrusion';
    else if (!position) blocked = 'coordinates';
    else if ([39, 40, 41, 42, 43].some(code => number(e, code, 0) !== 0)) blocked = 'geometry';
    else if (!copies.length) blocked = 'no-point-copy';
    result.findings.push({ id: e.id, handle: e.handle, layer: e.layer, xyz: position, pointCopies: copies, blocked });
  }
  return result;
}
/** Only cut selected source ranges. No compact export, filtering or normalization. */
export function exportSingleVertexRepair(report: SingleVertexCheck, selectedIds: readonly string[]) {
  const fresh = inspectSingleVertexPolylines(report.source);
  if (fresh.error) throw new Error(`repair-${fresh.error}`);
  const ids = new Set(selectedIds);
  for (const id of ids) {
    const f = fresh.findings.find(f => f.id === id);
    if (!f || f.blocked) throw new Error('repair-selection');
  }
  const before = inspectDxfDuplicates(report.source);
  const removed = before.entities.filter(e => ids.has(e.id));
  let source = report.source;
  for (const e of [...removed].reverse()) source = source.slice(0, e.start) + source.slice(e.end);
  const after = inspectDxfDuplicates(source), expected = before.entities.filter(e => !ids.has(e.id));
  if (after.error || after.entities.length !== expected.length || after.entities.some((e, i) => source.slice(e.start, e.end) !== report.source.slice(expected[i]!.start, expected[i]!.end))) throw new Error('repair-validation');
  return {
    source, remainingCount: after.entities.length,
    changes: fresh.findings.filter(f => ids.has(f.id)).map(f => ({ action: 'remove-single-vertex-lwpolyline' as const, handle: f.handle, layer: f.layer, xyz: f.xyz, preservedPoints: f.pointCopies })),
  };
}

export type SingleVertexAction = 'convert' | 'delete' | 'keep';
export function canRepair(f: SingleVertexFinding): boolean { return f.blocked === null || f.blocked === 'no-point-copy'; }

/** Apply actions to a freshly inspected, already filtered source. Never reuse old offsets. */
export function applySingleVertexActions(source: string, actions: ReadonlyMap<string, SingleVertexAction>) {
  const report = inspectSingleVertexPolylines(source);
  if (report.error) {
    if ([...actions.values()].some(a => a !== 'keep')) throw new Error('repair-unavailable');
    return { content: source, converted: 0, deleted: 0, reused: 0, changes: [] as Array<{ id: string; handle: string | null; layer: string; xyz: XYZ; action: string }> };
  }
  const check = inspectDxfDuplicates(source);
  let content = source, converted = 0, deleted = 0, reused = 0;
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const changes: Array<{ id: string; handle: string | null; layer: string; xyz: XYZ; action: string }> = [];
  const available = new Set(check.entities.filter(e => e.type === 'POINT' && standardExtrusion(e) && number(e,39,0) === 0 && xyz(e)).map(e => space(e) + JSON.stringify(xyz(e))));
  for (const [id, action] of actions) {
    if (action === 'keep') continue;
    const f = report.findings.find(f => f.id === id);
    if (!f || !canRepair(f) || !f.xyz) throw new Error('repair-selection');
    const e = check.entities.find(e => e.id === id)!;
    let text = '', applied: string = action;
    if (action === 'convert') {
      converted++;
      const key = space(e) + JSON.stringify(f.xyz);
      if (available.has(key)) { reused++; applied = 'reuse-point'; }
      else {
        available.add(key);
        const eol = source.includes('\r\n') ? '\r\n' : '\n';
        // Carry common entity properties, handle, owner, layer and drawing space.
        const common = e.tags.filter(t => [5,330,8,6,62,420,430,440,48,60,67,370,410].includes(t.code));
        const tags = [{code:0,value:'POINT'}, ...common.filter(t=>[5,330].includes(t.code)), {code:100,value:'AcDbEntity'}, ...common.filter(t=>![5,330].includes(t.code)), {code:100,value:'AcDbPoint'}, ...[10,20,30].map((code,i)=>({code,value:String(f.xyz![i])}))];
        text = tags.map(t=>`${t.code}${eol}${t.value}${eol}`).join('');
      }
    } else deleted++;
    edits.push({start:e.start,end:e.end,text}); changes.push({id:f.id,handle:f.handle,layer:f.layer,xyz:f.xyz,action:applied});
  }
  for (const e of edits.sort((a,b)=>b.start-a.start)) content=content.slice(0,e.start)+e.text+content.slice(e.end);
  const after = inspectDxfDuplicates(content);
  if (after.error || after.entities.length !== check.entities.length-deleted-reused) throw new Error('repair-validation');
  return {content,converted,deleted,reused,changes};
}
