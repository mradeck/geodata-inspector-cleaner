import { inspectDxfDuplicates } from "../duplicates/dxfDuplicates";

type Tag = { code: number; value: string };
type Record = { type: string; tags: Tag[]; section: string; table: string; raw: string };
const value = (r: Record, code: number) => r.tags.find((t) => t.code === code)?.value.trim() ?? "";
const key = (s: string) => s.toUpperCase();
const handleCode = (c: number) => c === 5 || c === 105 || (c >= 320 && c <= 369) || (c >= 390 && c <= 399) || c === 480 || c === 481 || c === 1005;

/** Merge native records/resources. Existing entity records remain byte-for-byte intact.
 * Incoming handles and conflicting symbol names are namespaced, including references. */
export function mergeDxf(base: string, addition: string): string {
  const a = records(base), b = records(addition);
  const before = inspectDxfDuplicates(base), extra = inspectDxfDuplicates(addition);
  if (before.error || extra.error) throw new Error("append-structure");
  const headerValue = (rs: Record[], name: string) => {
    const ts = rs.filter((r) => r.section === "HEADER").flatMap((r) => r.tags);
    const i = ts.findIndex((t) => t.code === 9 && t.value.trim() === name);
    return i < 0 ? "" : ts[i + 1]?.value.trim() ?? "";
  };
  const unitsA = Number(headerValue(a, "$INSUNITS")), unitsB = Number(headerValue(b, "$INSUNITS"));
  if (unitsA && unitsB && unitsA !== unitsB) throw new Error("append-units");
  // Unknown sections may contain format-specific links that cannot safely be relocated.
  if (b.some((r) => r.section && !["SECTION", "ENDSEC"].includes(r.type) && !["HEADER", "CLASSES", "TABLES", "BLOCKS", "ENTITIES", "OBJECTS"].includes(r.section))) throw new Error("append-structure");
  let highest = 0n;
  for (const r of a) for (const t of r.tags) if (handleCode(t.code) && /^[\da-f]+$/i.test(t.value.trim())) {
    const h = BigInt(`0x${t.value.trim()}`); if (h > highest) highest = h;
  }
  const fresh = () => (++highest).toString(16).toUpperCase();
  const handles = new Map<string, string>();
  for (const r of b) for (const t of r.tags) if (t.code === 5 || t.code === 105) {
    const old = key(t.value.trim()); if (old !== "0" && !handles.has(old)) handles.set(old, fresh());
  }
  // Also isolate unresolved references, preventing accidental links to unrelated base objects.
  for (const r of b) for (const t of r.tags) if (handleCode(t.code)) {
    const old = key(t.value.trim()); if (/^[\dA-F]+$/.test(old) && old !== "0" && !handles.has(old)) handles.set(old, fresh());
  }
  const omitted = new Set<Record>();
  const names = new Map<string, Map<string, string>>();
  const rename = (table: string, name: string) => names.get(table)?.get(key(name)) ?? name;
  const bind = (incoming: Record, existing: Record) => {
    for (const code of [5, 105]) if (value(incoming, code) && value(existing, code)) handles.set(key(value(incoming, code)), value(existing, code));
    omitted.add(incoming);
  };
  for (const table of new Set(b.filter((r) => r.table).map((r) => r.table))) {
    const originals = a.filter((r) => r.table === table && r.type !== "TABLE" && r.type !== "ENDTAB");
    const used = new Set(originals.map((r) => key(value(r, 2))));
    const mapping = new Map<string, string>(); names.set(table, mapping);
    for (const r of b.filter((r) => r.table === table && r.type !== "TABLE" && r.type !== "ENDTAB")) {
      const name = value(r, 2); if (!name) continue;
      const same = originals.find((o) => key(value(o, 2)) === key(name));
      const model = (table === "BLOCK_RECORD" && key(name) === "*MODEL_SPACE") || (table === "LAYER" && name === "0") || (table === "VPORT" && key(name) === "*ACTIVE");
      const signature = (rec: Record) => JSON.stringify(rec.tags.filter((t) => !handleCode(t.code) && t.code !== 102).map((t) => [t.code,t.value]));
      if (same && (model || (table !== "BLOCK_RECORD" && signature(same) === signature(r)))) { bind(r, same); continue; }
      let chosen = name;
      for (let n = 2; used.has(key(chosen)); n++) chosen = `${name}__${n}`;
      used.add(key(chosen)); mapping.set(key(name), chosen);
    }
    const incomingTable = b.find((r) => r.type === "TABLE" && r.table === table);
    const baseTable = a.find((r) => r.type === "TABLE" && r.table === table);
    if (incomingTable && baseTable) bind(incomingTable, baseTable);
  }
  const blockNames = names.get("BLOCK_RECORD") ?? new Map<string,string>();
  names.set("BLOCK_RECORD",blockNames);
  const usedBlocks = new Set(a.filter((r) => r.type === "BLOCK").map((r) => key(value(r,2))));
  for (const r of b.filter((r) => r.type === "BLOCK")) {
    const name = value(r,2);
    if (key(name) === "*MODEL_SPACE" || blockNames.has(key(name))) continue;
    let chosen = name;
    for (let n=2;usedBlocks.has(key(chosen));n++) chosen = `${name}__${n}`;
    usedBlocks.add(key(chosen)); blockNames.set(key(name),chosen);
  }
  // A document has one model-space block. Its contents still transfer if present.
  let inModel = false;
  const modelContents: Record[] = [];
  const baseModel = a.find((r) => r.type === "BLOCK" && key(value(r, 2)) === "*MODEL_SPACE");
  for (const r of b.filter((r) => r.section === "BLOCKS")) {
    if (r.type === "BLOCK") inModel = key(value(r, 2)) === "*MODEL_SPACE" && Boolean(baseModel);
    if (inModel) { omitted.add(r); if (!["BLOCK","ENDBLK"].includes(r.type)) modelContents.push(r); }
    if (r.type === "ENDBLK") inModel = false;
  }
  const root = (rs: Record[]) => rs.find((r) => r.section === "OBJECTS" && r.type === "DICTIONARY" && (!value(r, 330) || value(r, 330) === "0"));
  const rootA = root(a), rootB = root(b);
  const dictionaryAdditions = new Map<Record, Tag[]>();
  const layoutNames = new Map<string,string>();
  const layoutName = (r: Record) => r.tags.filter((t) => t.code === 1).at(-1)?.value ?? "";
  const entries = (r: Record) => r.tags.flatMap((t,i) => t.code === 3 && [350,360].includes(r.tags[i+1]?.code ?? -1) ? [{name:t.value,ref:r.tags[i+1]!}] : []);
  const mergeDictionary = (target: Record, source: Record, seen = new Set<Record>()) => {
    if (seen.has(source)) return; seen.add(source); bind(source,target);
    const taken = new Set(entries(target).map((e) => key(e.name)));
    const pending: Tag[] = [];
    for (const entry of entries(source)) {
      const existing = entries(target).find((e) => key(e.name) === key(entry.name));
      const sourceObject = b.find((r) => key(value(r,5)) === key(entry.ref.value));
      const targetObject = existing && a.find((r) => key(value(r,5)) === key(existing.ref.value));
      if (sourceObject?.type === "DICTIONARY" && targetObject?.type === "DICTIONARY") {
        mergeDictionary(targetObject,sourceObject,seen); continue;
      }
      if (sourceObject?.type === "LAYOUT" && targetObject?.type === "LAYOUT" && key(layoutName(sourceObject)) === "MODEL") {
        bind(sourceObject,targetObject); continue;
      }
      let name = entry.name;
      for (let n=2;taken.has(key(name));n++) name = `${entry.name}__${n}`;
      taken.add(key(name));
      if (sourceObject?.type === "LAYOUT") layoutNames.set(key(layoutName(sourceObject)),name);
      pending.push({code:3,value:name},{code:entry.ref.code,value:handles.get(key(entry.ref.value)) ?? entry.ref.value});
    }
    dictionaryAdditions.set(target,pending);
  };
  if (rootA && rootB) mergeDictionary(rootA,rootB);
  const newline = base.match(/\r\n|\n|\r/)?.[0] ?? "\n";
  const serialize = (tags: Tag[]) => tags.map((t) => `${t.code}${newline}${t.value}${newline}`).join("");
  const converted = (r: Record): string => {
    let subclass = "";
    const tags = r.tags.map((t) => {
      let v = t.value;
      if (t.code === 100) subclass = v.trim();
      if (handleCode(t.code)) v = handles.get(key(v.trim())) ?? v;
      if (t.code === 8 || t.code === 1003) v = rename("LAYER", v);
      if (t.code === 6) v = rename("LTYPE", v);
      if (t.code === 7) v = rename("STYLE", v);
      if (t.code === 1001) v = rename("APPID", v);
      if (t.code === 2 && r.section === "TABLES" && r.type !== "TABLE") v = rename(r.table, v);
      if ((t.code === 2 && ["INSERT","DIMENSION","BLOCK"].includes(r.type)) || (t.code === 3 && r.type === "BLOCK")) v = rename("BLOCK_RECORD", v);
      if (t.code === 3 && r.type === "DIMENSION") v = rename("DIMSTYLE", v);
      // Layout names must remain unique as well as their underlying block names.
      if (t.code === 410 || (r.type === "LAYOUT" && subclass === "AcDbLayout" && t.code === 1)) v = layoutNames.get(key(v)) ?? v;
      return { code: t.code, value: v };
    });
    return serialize(tags);
  };
  const sections = new Map<string,string>();
  for (const section of ["CLASSES","BLOCKS","ENTITIES","OBJECTS"]) {
    sections.set(section,b.filter((r) => r.section === section && !["SECTION","ENDSEC"].includes(r.type) && !omitted.has(r))
      .filter((r) => section !== "CLASSES" || !a.some((o) => o.section === section && value(o,1) === value(r,1)))
      .map(converted).join(""));
  }
  if (!a.some((r) => r.type === "SECTION" && r.section === "HEADER")) sections.set("HEADER", serialize(b.filter((r) => r.section === "HEADER" && r.type === "SECTION").flatMap((r) => r.tags.slice(2)).map((t) => handleCode(t.code) ? {...t,value:handles.get(key(t.value.trim())) ?? t.value} : t)));
  const newHeader = sections.get("HEADER");
  let output = newHeader ? serialize([{code:0,value:"SECTION"},{code:2,value:"HEADER"}]) + newHeader + serialize([{code:0,value:"ENDSEC"}]) : "";
  sections.delete("HEADER");
  const existingSections = new Set(a.filter((r) => r.type === "SECTION").map((r) => r.section));
  const newTables = b.filter((r) => r.type === "TABLE" && !a.some((o) => o.type === "TABLE" && o.table === r.table));
  const extraTables = () => newTables.map((t) => b.filter((r) => r.table === t.table).map(converted).join("")).join("");
  let baseInModel = false;
  for (const r of a) {
    if (r.type === "BLOCK") baseInModel = key(value(r,2)) === "*MODEL_SPACE";
    if (r.type === "ENDBLK" && baseInModel) { output += modelContents.map(converted).join(""); baseInModel = false; }
    if (r.type === "ENDTAB") output += b.filter((o) => o.table === r.table && !["TABLE","ENDTAB"].includes(o.type) && !omitted.has(o)).map(converted).join("");
    if (r.type === "ENDSEC") output += r.section === "TABLES" ? extraTables() : sections.get(r.section) ?? "";
    if (r.type === "EOF") {
      for (const [section,content] of [...sections, ["TABLES",extraTables()] as [string,string]]) if (content && !existingSections.has(section)) output += serialize([{code:0,value:"SECTION"},{code:2,value:section}])+content+serialize([{code:0,value:"ENDSEC"}]);
    }
    if (dictionaryAdditions.has(r)) output += r.raw + serialize(dictionaryAdditions.get(r)!);
    else if (r.type === "TABLE") {
      const count = a.filter((o) => o.table === r.table && !["TABLE","ENDTAB"].includes(o.type)).length + b.filter((o) => o.table === r.table && !["TABLE","ENDTAB"].includes(o.type) && !omitted.has(o)).length;
      output += serialize(r.tags.map((t) => t.code === 70 ? {code:70,value:String(count)} : t));
    } else if (r.section === "HEADER") {
      let variable = "";
      output += serialize(r.tags.map((t) => {
        if (t.code === 9) variable = t.value.trim();
        if (variable === "$HANDSEED" && t.code === 5) return { ...t, value:fresh() };
        if (variable === "$ACADVER" && t.code === 1) return { ...t, value:[t.value,headerValue(b,"$ACADVER")].sort().at(-1)! };
        if (["$EXTMIN","$EXTMAX"].includes(variable) && [10,20,30].includes(t.code)) {
          const bt = b.filter((rec) => rec.section === "HEADER").flatMap((rec) => rec.tags);
          const start = bt.findIndex((tag) => tag.code === 9 && tag.value.trim() === variable);
          const incoming = bt.slice(start+1,start+4).find((tag) => tag.code === t.code);
          if (start >= 0 && incoming && Number.isFinite(Number(t.value)) && Number.isFinite(Number(incoming.value))) {
            return { ...t, value:String(variable === "$EXTMIN" ? Math.min(Number(t.value),Number(incoming.value)) : Math.max(Number(t.value),Number(incoming.value))) };
          }
        }
        return t;
      }));
    } else output += r.raw;
  }
  const after = inspectDxfDuplicates(output);
  if (after.error || after.entities.length !== before.entities.length + extra.entities.length) throw new Error("append-validation");
  before.entities.forEach((entity,i) => {
    const kept = after.entities[i]!;
    if (base.slice(entity.start,entity.end) !== output.slice(kept.start,kept.end)) throw new Error("append-validation");
  });
  return output;
}
function records(source: string): Record[] {
  const lines = [...source.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)].filter((m) => m[0].length);
  const out: Record[] = []; let section="", table="", current: Record | undefined;
  for (let i=0;i<lines.length;i+=2) {
    const first=lines[i]!, second=lines[i+1]; if (!second) throw new Error("append-structure");
    const tag={code:Number(first[0].trim()),value:second[0].replace(/[\r\n]+$/,"")};
    if (tag.code===0) { current={type:tag.value.trim(),tags:[],raw:"",section,table};out.push(current); }
    if (!current) throw new Error("append-structure");
    current.tags.push(tag);current.raw+=first[0]+second[0];
    if(current.type==="SECTION"&&tag.code===2) {section=tag.value.trim();current.section=section;}
    if(current.type==="TABLE"&&tag.code===2) {table=tag.value.trim();current.table=table;}
    if(current.type==="ENDSEC") section="";
    if(current.type==="ENDTAB") table="";
  }
  return out;
}
