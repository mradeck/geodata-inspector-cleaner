import {expect,it} from 'vitest';
import {readFileSync,writeFileSync} from 'node:fs';
import {compactDxf} from './compactDxf';
import {parseDxf} from './parseDxf';
import {createPlannedDxf,defaultAreaRemovalIds} from './exportPlan';
import {analyzeDataset} from '../analysis/analyzeDataset';
import {inspectDxfDuplicates} from '../duplicates/dxfDuplicates';
const tags=(...v:(number|string)[])=>v.join('\n')+'\n';
const file=(entities:string)=>tags(0,'SECTION',2,'ENTITIES')+entities+tags(0,'ENDSEC',0,'EOF');
it('preserves exact native polyline coordinates, bulges, widths, elevation and normal',()=>{
 const entity=tags(0,'LWPOLYLINE',5,'A',100,'AcDbEntity',8,'Exact',100,'AcDbPolyline',90,2,70,1,38,123.123456789,10,700000.123456789,20,5300000.123456789,40,1,41,2,42,0.5,10,700001,20,5300002,210,0,220,0.6,230,0.8);
 const out=compactDxf(file(entity));const e=inspectDxfDuplicates(out.content).entities[0]!;
 for(const code of [10,20,38,40,41,42,70,210,220,230])expect(e.tags.filter(t=>t.code===code).map(t=>t.value)).toEqual(inspectDxfDuplicates(file(entity)).entities[0]!.tags.filter(t=>t.code===code).map(t=>t.value));
 expect(e.layer).toBe('Exact');
});
it('blocks unsupported retained geometry instead of silently losing it',()=>{
 expect(()=>compactDxf(file(tags(0,'3DSOLID',5,'A',8,'0')))).toThrow('compact-unsupported:3DSOLID');
});
it('retains complete POLYLINE vertex sequences',()=>{
 const out=compactDxf(file(tags(0,'POLYLINE',5,'A',100,'AcDbEntity',8,'0',100,'AcDb3dPolyline',66,1,70,9,0,'VERTEX',5,'B',330,'A',100,'AcDbEntity',8,'0',100,'AcDbVertex',100,'AcDb3dPolylineVertex',10,1,20,2,30,3,70,32,0,'SEQEND',5,'C',330,'A',100,'AcDbEntity',8,'0')));
 const check=inspectDxfDuplicates(out.content);expect(check.error).toBeNull();expect(check.entities).toHaveLength(1);expect(check.entities[0]!.tags.some(t=>t.code===30&&t.value==='3')).toBe(true);
});
it.skipIf(!process.env.HATCH_FIXTURE)('creates a tiny complete shape document directly from the original sample',()=>{
 const d=parseDxf(readFileSync(process.env.HATCH_FIXTURE!,'utf8'),'sample.dxf');
 const out=createPlannedDxf(d,{compact:true,hatchOutlines:true,duplicateIds:new Set(d.dxfDuplicates!.candidates.filter(c=>!c.blocked).map(c=>c.entityId)),removedFeatureIds:defaultAreaRemovalIds(analyzeDataset(d,{}, {analysisCrs:'EPSG:25832'}).clusters)});
 const c=inspectDxfDuplicates(out.content);expect(c.entities).toHaveLength(33);expect(c.entities.every(e=>e.type==='LWPOLYLINE')).toBe(true);expect(c.candidates).toHaveLength(0);expect(out.audit.replacedHatchCount).toBe(32);
 expect(Buffer.byteLength(out.content)).toBeLessThan(30000);expect(analyzeDataset(parseDxf(out.content,'again.dxf')).clusters).toHaveLength(1);
 const again=compactDxf(out.content);expect(again.entityCount).toBe(33);
 if(process.env.COMPACT_TEST_OUTPUT)writeFileSync(process.env.COMPACT_TEST_OUTPUT,out.content);
});
it.skipIf(!process.env.EXPORTED_HATCH_FIXTURE)('compacts an existing outline export without creating another set of contours',()=>{
 const d=parseDxf(readFileSync(process.env.EXPORTED_HATCH_FIXTURE!,'utf8'),'old.dxf');const out=createPlannedDxf(d,{compact:true,hatchOutlines:false,duplicateIds:new Set(),removedFeatureIds:defaultAreaRemovalIds(analyzeDataset(d,{}, {analysisCrs:'EPSG:25832'}).clusters)});
 expect(out.keptCount).toBe(33);expect(out.audit.createdOutlines).toHaveLength(0);expect(out.audit.replacedHatchCount).toBe(32);
});

it('keeps duplicate hatches when no contours exist and generation is disabled',()=>{
 const hatch=(id:string)=>tags(0,'HATCH',5,id,100,'AcDbEntity',8,'0',100,'AcDbHatch',91,1,92,2,72,0,73,1,93,3,10,0,20,0,10,1,20,0,10,0,20,1,97,0);
 const out=compactDxf(file(hatch('A')+hatch('B')));expect(out.entityCount).toBe(2);expect(out.removedHatches).toBe(0);
});
it('retains only used block definitions and their layers with complete INSERT attributes',()=>{
 const block=(name:string,h:string)=>tags(0,'BLOCK',5,h,100,'AcDbEntity',8,'0',100,'AcDbBlockBegin',2,name,70,0,10,0,20,0,30,0,0,'LINE',5,h+'1',100,'AcDbEntity',8,'block-layer',100,'AcDbLine',10,1,20,2,30,3,11,4,21,5,31,6,0,'ENDBLK',5,h+'2',100,'AcDbEntity',8,'0',100,'AcDbBlockEnd');
 const source=tags(0,'SECTION',2,'BLOCKS')+block('Used','B0')+block('Unused','C0')+tags(0,'ENDSEC')+file(tags(0,'INSERT',5,'A',100,'AcDbEntity',8,'0',100,'AcDbBlockReference',2,'Used',66,1,10,1,20,2,30,3,41,2,42,2,43,2,0,'ATTRIB',5,'A1',330,'A',100,'AcDbEntity',8,'0',100,'AcDbText',10,1,20,2,30,3,40,1,1,'Name',100,'AcDbAttribute',2,'TAG',70,0,0,'SEQEND',5,'A2',330,'A',100,'AcDbEntity',8,'0'));
 const out=compactDxf(source);expect(out.entityCount).toBe(1);expect(out.content).toContain('Used');expect(out.content).not.toContain('Unused');expect(out.content).toContain('block-layer');
 expect(inspectDxfDuplicates(out.content).entities[0]!.tags.filter(t=>t.code===0).map(t=>t.value)).toEqual(['INSERT','ATTRIB','SEQEND']);
});

it.each([false, true])('accepts DXF comments before SECTION and between records (stripAnnotations=%s)', stripAnnotations => {
 const point=tags(0,'POINT',5,'A',100,'AcDbEntity',8,'Survey',100,'AcDbPoint',10,123.456789,999,'Comment within entity',20,456.789123,30,42.123456);
 const text=tags(0,'TEXT',5,'B',100,'AcDbEntity',8,'Labels',100,'AcDbText',10,123,20,456,30,42,40,1,1,'Point name');
 const source=tags(999,'Synthetic CAD exporter',999,'Second comment')+file(point+text);
 const dataset=parseDxf(source,'synthetic-comments.dxf');
 const result=createPlannedDxf(dataset,{compact:true,stripAnnotations,duplicateIds:new Set(),removedFeatureIds:new Set(),hatchOutlines:false});
 const check=inspectDxfDuplicates(result.content);
 expect(check.error).toBeNull();
 expect(check.entities.map(e=>e.type)).toEqual(stripAnnotations?['POINT']:['POINT','TEXT']);
 for(const code of [10,20,30])expect(check.entities[0]!.tags.find(t=>t.code===code)?.value).toBe(dataset.dxfDuplicates!.entities[0]!.tags.find(t=>t.code===code)?.value);
 expect(dataset.dxfDuplicates!.source).toBe(source);
});
