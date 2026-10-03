import { inspectDxfDuplicates } from '../duplicates/dxfDuplicates';
import { inspectHatchOutlines } from '../hatches/hatchOutlines';

type Tag = { code: number; value: string };
type Record = { type: string; tags: Tag[]; section: string };
const supported = new Set(['POINT','LINE','ARC','CIRCLE','ELLIPSE','SPLINE','LWPOLYLINE','POLYLINE','VERTEX','SEQEND','3DFACE','SOLID','TRACE','TEXT','MTEXT','INSERT','ATTRIB','ATTDEF','HATCH']);
const val = (r: Record, code: number) => r.tags.find(t => t.code === code)?.value.trim() ?? '';
const pair = (code: number, value: string|number): Tag => ({code,value:String(value)});
function records(text: string): Record[] {
  const lines=text.split(/\r\n|\n|\r/); if(lines.at(-1)==='')lines.pop();
  const out: Record[]=[];let section='';let r:Record|undefined;
  for(let i=0;i<lines.length;i+=2){const t=pair(Number(lines[i]),lines[i+1]!);
    if(t.code===0){r={type:t.value.trim(),tags:[],section};out.push(r);}
    if(!r)throw new Error('invalid-dxf');r.tags.push(t);
    if(r.type==='SECTION'&&t.code===2){section=t.value.trim();r.section=section;}
    if(r.type==='ENDSEC')section='';
  }return out;
}

/** Fresh CAD document with native geometry and only its required tables/blocks.
 * No preview coordinates, extension dictionaries, application data or proxy graphics. */
export function compactDxf(source: string, options: { stripAnnotations?: boolean } = {}) {
  let removedAnnotations = 0, removedAnnotationEntities = 0;
  if (options.stripAnnotations) {
    const before = inspectDxfDuplicates(source);
    let parent = '';
    const stripped = records(source).filter(r => {
      if (!['ENTITIES','BLOCKS'].includes(r.section)) return true;
      if (['TEXT','MTEXT','ATTRIB','ATTDEF'].includes(r.type)) { removedAnnotations++; return false; }
      if (r.type === 'SEQEND') { const omit = parent === 'INSERT'; parent = ''; return !omit; }
      if (!['VERTEX','ATTRIB'].includes(r.type)) parent = r.type;
      if (r.type === 'INSERT') r.tags = r.tags.filter(t=>t.code!==66);
      return true;
    });
    source = stripped.flatMap(r=>r.tags.flatMap(t=>[t.code,t.value])).join('\n')+'\n';
    const after = inspectDxfDuplicates(source);
    if (before.error || after.error) throw new Error('annotation-validation');
    removedAnnotationEntities = before.entities.length-after.entities.length;
  }
  const inspected=inspectDxfDuplicates(source);if(inspected.error)throw new Error('invalid-dxf');
  const polylines=inspected.entities.filter(e=>e.type==='LWPOLYLINE');
  const covered=new Set(inspected.entities.filter(e=>{
    if(e.type!=='HATCH')return false;
    const outlines=inspectHatchOutlines({...inspected,entities:[...polylines,e]});
    return !outlines.error&&!outlines.skipped.length&&outlines.outlines.length>0&&outlines.outlines.every(o=>o.exists);
  }).map(e=>e.id));
  let filtered=source;
  for(const e of [...inspected.entities].reverse())if(covered.has(e.id))filtered=filtered.slice(0,e.start)+filtered.slice(e.end);
  const all=records(filtered);
  const entities=all.filter(r=>r.section==='ENTITIES'&&supported.has(r.type));
  const unsupported=all.filter(r=>r.section==='ENTITIES'&&!['SECTION','ENDSEC'].includes(r.type)&&!supported.has(r.type));
  if(unsupported.length)throw new Error('compact-unsupported:'+ [...new Set(unsupported.map(r=>r.type))].join(', '));
  const blocks=new Map<string,Record[]>();let block:Record[]|undefined;
  for(const r of all.filter(r=>r.section==='BLOCKS')){
    if(r.type==='BLOCK'){block=[];blocks.set(val(r,2),block);}
    if(block)block.push(r);if(r.type==='ENDBLK')block=undefined;
  }
  const usedBlocks=new Map<string,Record[]>();
  const visit=(list:Record[])=>{for(const r of list)if(r.type==='INSERT'){
    const name=val(r,2);if(usedBlocks.has(name))continue;
    const contents=blocks.get(name);if(!contents)throw new Error('compact-missing-block:'+name);
    const bad=contents.filter(r=>!supported.has(r.type)&&!['BLOCK','ENDBLK'].includes(r.type));
    if(bad.length)throw new Error('compact-unsupported:'+bad.map(r=>r.type).join(', '));
    usedBlocks.set(name,contents);visit(contents);
  }};visit(entities);
  const geometry=[...entities,...[...usedBlocks.values()].flat()];
  const layerNames=new Set(['0',...geometry.map(r=>val(r,8)||'0')]);
  const styleNames=new Set(['Standard',...geometry.filter(r=>['TEXT','MTEXT','ATTRIB','ATTDEF'].includes(r.type)).map(r=>val(r,7)||'Standard')]);
  const layers=all.filter(r=>r.section==='TABLES'&&r.type==='LAYER'&&layerNames.has(val(r,2)));
  const ltypeNames=new Set(['ByLayer','ByBlock','CONTINUOUS',...geometry.map(r=>val(r,6)).filter(Boolean),...layers.map(r=>val(r,6)).filter(Boolean)]);
  const ltypes=all.filter(r=>r.section==='TABLES'&&r.type==='LTYPE'&&[...ltypeNames].some(n=>n.toLowerCase()===val(r,2).toLowerCase()));
  // Complex line types depend on a text style by handle.
  const styleHandles=new Set(ltypes.flatMap(r=>r.tags.filter(t=>t.code===340).map(t=>t.value.trim().toUpperCase())));
  const styles=all.filter(r=>r.section==='TABLES'&&r.type==='STYLE'&&(styleNames.has(val(r,2))||styleHandles.has(val(r,5).toUpperCase())));
  let next=0x100;const fresh=()=> (next++).toString(16).toUpperCase();
  const model=fresh(),paper=fresh(),root=fresh();
  const tableHandles=new Map(['LTYPE','LAYER','STYLE','BLOCK_RECORD'].map(n=>[n,fresh()]));
  const blockHandles=new Map<string,string>([['*Model_Space',model],['*Paper_Space',paper],...[...usedBlocks.keys()].map(n=>[n,fresh()] as [string,string])]);
  const ids=new Map<Record,string>();const handles=new Map<string,string>();
  for(const r of [...layers,...ltypes,...styles,...geometry]){const h=fresh();ids.set(r,h);if(val(r,5))handles.set(val(r,5).toUpperCase(),h);}
  for(const r of all.filter(r=>r.type==='BLOCK_RECORD')){const h=blockHandles.get(val(r,2));if(h)handles.set(val(r,5).toUpperCase(),h);}
  const output:Tag[]=[];const add=(...tags:Tag[])=>output.push(...tags);
  const emit=(r:Record,owner:string)=>{
    add(pair(0,r.type),pair(5,ids.get(r)??fresh()),pair(330,owner));
    let depth=0;let subclass='';
    for(let i=1;i<r.tags.length;i++){
      const t=r.tags[i]!;
      if(t.code===102){if(t.value.trim().startsWith('{'))depth++;else if(t.value.trim()==='}')depth--;continue;}
      if(depth||t.code>=1000||[5,105,67,410,310,999].includes(t.code))continue;
      if(t.code===100)subclass=t.value.trim();
      // Hatches become non-associative when application/owner links are removed.
      if(r.type==='HATCH'&&subclass==='AcDbHatch'&&t.code===71){add(pair(71,0));continue;}
      if(r.type==='HATCH'&&t.code===97&&r.tags[i+1]?.code===330){add(pair(97,0));continue;}
      if(t.code===330)continue;
      if((t.code>=320&&t.code<=369)||[390,480,481].includes(t.code)){
        const mapped=handles.get(t.value.trim().toUpperCase());if(mapped)add(pair(t.code,mapped));continue;
      }
      add(t);
    }
  };
  const section=(name:string)=>add(pair(0,'SECTION'),pair(2,name));const end=()=>add(pair(0,'ENDSEC'));
  section('HEADER');add(pair(9,'$ACADVER'),pair(1,'AC1032'));
  const sourceTags=all.filter(r=>r.section==='HEADER').flatMap(r=>r.tags);
  for(const name of ['$INSUNITS','$MEASUREMENT']){const i=sourceTags.findIndex(t=>t.code===9&&t.value===name);if(i>=0&&sourceTags[i+1])add(pair(9,name),sourceTags[i+1]!);}
  end();section('TABLES');
  for(const [name,list] of [['LTYPE',ltypes],['LAYER',layers],['STYLE',styles]] as const){
    add(pair(0,'TABLE'),pair(2,name),pair(5,tableHandles.get(name)!),pair(330,'0'),pair(100,'AcDbSymbolTable'),pair(70,list.length));
    for(const r of list)emit(r,tableHandles.get(name)!);
    // Supply missing basic definitions (minimal input DXFs need not contain TABLES).
    const needed=name==='LAYER'?layerNames:name==='STYLE'?styleNames:ltypeNames;
    for(const n of needed)if(!list.some(r=>val(r,2).toLowerCase()===n.toLowerCase())){
      add(pair(0,name),pair(5,fresh()),pair(330,tableHandles.get(name)!),pair(100,'AcDbSymbolTableRecord'),pair(100,name==='LAYER'?'AcDbLayerTableRecord':name==='STYLE'?'AcDbTextStyleTableRecord':'AcDbLinetypeTableRecord'),pair(2,n),pair(70,0));
      if(name==='LAYER')add(pair(62,7),pair(6,'CONTINUOUS'));
      if(name==='STYLE')add(pair(40,0),pair(41,1),pair(50,0),pair(71,0),pair(42,2.5),pair(3,'txt'),pair(4,''));
      if(name==='LTYPE')add(pair(3,''),pair(72,65),pair(73,0),pair(40,0));
    }add(pair(0,'ENDTAB'));
  }
  add(pair(0,'TABLE'),pair(2,'BLOCK_RECORD'),pair(5,tableHandles.get('BLOCK_RECORD')!),pair(330,'0'),pair(100,'AcDbSymbolTable'),pair(70,blockHandles.size));
  for(const [n,h] of blockHandles)add(pair(0,'BLOCK_RECORD'),pair(5,h),pair(330,tableHandles.get('BLOCK_RECORD')!),pair(100,'AcDbSymbolTableRecord'),pair(100,'AcDbBlockTableRecord'),pair(2,n),pair(70,0),pair(280,1),pair(281,0));
  add(pair(0,'ENDTAB'));end();section('BLOCKS');
  for(const [name,h] of blockHandles){const list=usedBlocks.get(name);if(list){let parent=h;for(const r of list){emit(r,['VERTEX','ATTRIB','SEQEND'].includes(r.type)?parent:h);if(['POLYLINE','INSERT'].includes(r.type))parent=ids.get(r)!;}}else{
    add(pair(0,'BLOCK'),pair(5,fresh()),pair(330,h),pair(100,'AcDbEntity'),pair(8,'0'),pair(100,'AcDbBlockBegin'),pair(2,name),pair(70,0),pair(10,0),pair(20,0),pair(30,0),pair(3,name),pair(1,''));
    add(pair(0,'ENDBLK'),pair(5,fresh()),pair(330,h),pair(100,'AcDbEntity'),pair(8,'0'),pair(100,'AcDbBlockEnd'));
  }}end();section('ENTITIES');let parent=model;
  for(const r of entities){emit(r,['VERTEX','ATTRIB','SEQEND'].includes(r.type)?parent:model);if(['POLYLINE','INSERT'].includes(r.type))parent=ids.get(r)!;}end();
  section('OBJECTS');add(pair(0,'DICTIONARY'),pair(5,root),pair(330,'0'),pair(100,'AcDbDictionary'),pair(281,1));end();add(pair(0,'EOF'));
  // Accurate table counts, including default records added above.
  for(let i=0;i<output.length;i++)if(output[i]!.code===0&&output[i]!.value==='TABLE'){
    let count=0;let countIndex=-1;for(let j=i+1;j<output.length;j++){const t=output[j]!;if(t.code===0&&t.value==='ENDTAB')break;if(t.code===0)count++;if(t.code===70&&countIndex<0)countIndex=j;}if(countIndex>=0)output[countIndex]=pair(70,count);
  }
  const content=output.flatMap(t=>[t.code,t.value]).join('\n')+'\n';
  const check=inspectDxfDuplicates(content);if(check.error||check.entities.length!==inspected.entities.length-covered.size)throw new Error('compact-validation');
  return {content,removedHatches:covered.size,entityCount:check.entities.length,removedAnnotations,removedAnnotationEntities};
}
