import { analyzeDataset } from "../analysis/analyzeDataset";
import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { parseDxf } from "./parseDxf";
import { createPlannedDxf, defaultAreaRemovalIds } from "./exportPlan";
import { inspectDxfDuplicates } from "../duplicates/dxfDuplicates";
import { buildDefaultSelection, filterFeatures, summarizeLayers } from "../analysis/layerFilter";
const pair = (...v: (string|number)[]) => v.join('\n')+'\n';
const hatch = (h:string, layer='A') => pair(0,'HATCH',5,h,330,'FF',100,'AcDbEntity',8,layer,100,'AcDbHatch',91,1,92,2,72,0,73,1,93,4,10,0,20,0,10,10,20,0,10,10,20,10,10,0,20,10,97,0);
const file=(entities:string,objects='')=>pair(0,'SECTION',2,'ENTITIES')+entities+pair(0,'ENDSEC')+objects+pair(0,'EOF');
const empty={duplicateIds:new Set<string>(),removedFeatureIds:new Set<string>(),hatchOutlines:false};
describe('combined export plan',()=>{
 it('applies duplicate removal and outline generation in one pass without modifying input',()=>{
  const text=file(hatch('A0')+hatch('B0'));
  const d=parseDxf(text,'test.dxf');const ids=new Set(d.dxfDuplicates!.candidates.map(c=>c.entityId));
  const out=createPlannedDxf(d,{...empty,duplicateIds:ids,hatchOutlines:true});
  expect(out.removedCount).toBe(1);expect(out.audit.createdOutlines).toHaveLength(1);
  expect(inspectDxfDuplicates(out.content).entities.map(e=>e.type)).toEqual(['HATCH','LWPOLYLINE']);
  expect(d.dxfDuplicates!.source).toBe(text);
  expect(createPlannedDxf(d,empty).content).toBe(text);
 });
 it('does not generate outlines for hatches selected for removal',()=>{
  const d=parseDxf(file(hatch('A0')+hatch('B0','B')),'test.dxf');
  const out=createPlannedDxf(d,{...empty,removedFeatureIds:new Set([d.features[0]!.id]),hatchOutlines:true});
  expect(out.audit.createdOutlines.map(o=>o.layer)).toEqual(['B']);
  expect(inspectDxfDuplicates(out.content).entities.every(e=>e.layer==='B')).toBe(true);
 });
 it('retains referenced entities and reports unfulfilled removals',()=>{
  const d=parseDxf(file(hatch('A0'),pair(0,'SECTION',2,'OBJECTS',0,'XRECORD',340,'A0',0,'ENDSEC')),'test.dxf');
  const out=createPlannedDxf(d,{...empty,removedFeatureIds:new Set([d.features[0]!.id])});
  expect(out.removedCount).toBe(0);expect(out.audit.protectedObjectsRetained).toEqual(['A0']);
 });
 it('maps handleless entities and compound INSERT attributes to the original source record',()=>{
  const text=file(pair(0,'POINT',8,'A',10,1,20,2)+pair(0,'INSERT',8,'B',66,1,10,3,20,4,0,'ATTRIB',8,'B',10,3,20,4,1,'text',0,'SEQEND')+pair(0,'POINT',8,'C',10,5,20,6));
  const d=parseDxf(text,'handles.dxf');expect(d.features.map(f=>f.sourceEntityId)).toEqual(['entity-1','entity-2','entity-2','entity-3']);
  const out=createPlannedDxf(d,{...empty,removedFeatureIds:new Set([d.features[0]!.id,d.features[1]!.id])});
  expect(out.removedCount).toBe(1);expect(out.audit.partialObjectsRetained).toEqual(['entity-2']);
  expect(inspectDxfDuplicates(out.content).entities.map(e=>e.type)).toEqual(['INSERT','POINT']);
 });
 it('keeps generated contours unique on a repeated export',()=>{
  const d=parseDxf(file(hatch('A0')),'test.dxf');const first=createPlannedDxf(d,{...empty,hatchOutlines:true});
  const second=createPlannedDxf(parseDxf(first.content,'second.dxf'),{...empty,hatchOutlines:true});
  expect(second.content).toBe(first.content);expect(second.audit.createdOutlines).toHaveLength(0);
 });
});
it.skipIf(!process.env.HATCH_FIXTURE)('exports the private sample with all default choices in a single step',()=>{
 const d=parseDxf(readFileSync(process.env.HATCH_FIXTURE!,'utf8'),'sample.dxf');
 const outside=new Set(analyzeDataset(d, {}, {analysisCrs:"EPSG:25832"}).clusters.filter(c=>!c.isPrimary).flatMap(c=>c.featureIds));
 const keep=new Set(filterFeatures(d.features,buildDefaultSelection(summarizeLayers(d))).map(f=>f.id));
 const out=createPlannedDxf(d,{duplicateIds:new Set(d.dxfDuplicates!.candidates.filter(c=>!c.blocked).map(c=>c.entityId)), removedFeatureIds:new Set(d.features.filter(f=>outside.has(f.id)||!keep.has(f.id)).map(f=>f.id)),hatchOutlines:true});
 expect(out.audit.protectedObjectsRetained).toEqual([]); expect(out.audit.partialObjectsRetained).toEqual([]);
 expect(out.removedCount).toBe(6); expect(out.keptCount).toBe(65);
 expect(analyzeDataset(parseDxf(out.content,"reimport.dxf")).clusters).toHaveLength(1);
 expect(out.audit.createdOutlines).toHaveLength(33);expect(out.audit.selectedDuplicateCount).toBe(2);
 const result=inspectDxfDuplicates(out.content);expect(result.candidates).toHaveLength(0);
 expect(result.entities.filter(e=>e.type==='HATCH')).toHaveLength(32);
 expect(result.entities.filter(e=>e.type==='LWPOLYLINE')).toHaveLength(33);
 if(process.env.PLAN_TEST_OUTPUT)writeFileSync(process.env.PLAN_TEST_OUTPUT,out.content);
});

it('does not select distant areas without an explicit user decision', () => {
 expect([...defaultAreaRemovalIds([{isPrimary:true,featureIds:['main']},{isPrimary:false,featureIds:['outside','other']}])]).toEqual([]);
 expect([...defaultAreaRemovalIds([{isPrimary:true,featureIds:['only']}])]).toEqual([]);
});

it.skipIf(!process.env.EXPORTED_HATCH_FIXTURE)('removes the surviving remote area from the actual 3.8 export and remains stable on reimport', () => {
 const d=parseDxf(readFileSync(process.env.EXPORTED_HATCH_FIXTURE!,'utf8'),'export-v3.8.dxf');
 const report=analyzeDataset(d, {}, {analysisCrs:'EPSG:25832'});
 expect(report.clusters.map(c=>c.featureCount).sort((a,b)=>a-b)).toEqual([29,65]);
 const out=createPlannedDxf(d,{...empty,removedFeatureIds:new Set(report.clusters.filter(c=>!c.isPrimary).flatMap(c=>c.featureIds)),hatchOutlines:true});
 expect(out.removedCount).toBe(4); expect(out.keptCount).toBe(65);
 expect(out.audit.protectedObjectsRetained).toEqual([]);expect(out.audit.createdOutlines).toHaveLength(0);
 const loaded=parseDxf(out.content,'fixed.dxf');
 expect(analyzeDataset(loaded).clusters).toHaveLength(1);expect(loaded.features).toHaveLength(65);
 expect(createPlannedDxf(loaded,{...empty,hatchOutlines:true}).content).toBe(out.content);
 if(process.env.REPAIRED_TEST_OUTPUT)writeFileSync(process.env.REPAIRED_TEST_OUTPUT,out.content);
});
