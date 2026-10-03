import { describe, expect, it } from 'vitest';
import { parseDxf } from '../io/parseDxf';
import { createPlannedDxf } from '../io/exportPlan';
import { inspectDxfDuplicates } from '../duplicates/dxfDuplicates';
const tags=(...v:(string|number)[])=>v.join('\n')+'\n';
const line=(h:string,x=1)=>tags(0,'LWPOLYLINE',5,h,100,'AcDbEntity',8,'LINES',100,'AcDbPolyline',90,1,70,0,10,x,20,2,38,3);
const point=tags(0,'POINT',5,'A',100,'AcDbEntity',8,'POINTS',100,'AcDbPoint',10,1,20,2,30,3);
const file=(entities:string)=>tags(0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1032',0,'ENDSEC',0,'SECTION',2,'ENTITIES')+entities+tags(0,'ENDSEC',0,'EOF');
function run(source:string, actions:Map<string,'convert'|'delete'|'keep'>,removed=new Set<string>()){
 return createPlannedDxf(parseDxf(source,'test.dxf'),{compact:true,duplicateIds:new Set(),removedFeatureIds:removed,hatchOutlines:false,singleVertexActions:actions});
}
describe('combined singleton conversion',()=>{
 it('converts a singleton without a point copy, keeping layer and exact XYZ',()=>{
  const out=run(file(line('B')),new Map([['entity-1','convert']]));
  const entities=inspectDxfDuplicates(out.content).entities;
  expect(entities).toHaveLength(1);expect(entities[0]!.type).toBe('POINT');expect(entities[0]!.layer).toBe('LINES');
  for(const [code,value] of [[10,'1'],[20,'2'],[30,'3']] as const)expect(entities[0]!.tags.find(t=>t.code===code)?.value.trim()).toBe(value);
  expect(out.audit.convertedSingleVertices).toBe(1);expect(out.audit.reusedPoints).toBe(0);
  expect(parseDxf(out.content,'reimport.dxf').singleVertexPolylines?.findings).toHaveLength(0);
 });
 it('reuses retained point copies, including on another layer',()=>{
  const out=run(file(point+line('B')),new Map([['entity-2','convert']]));
  expect(out.keptCount).toBe(1);expect(out.audit.reusedPoints).toBe(1);expect(inspectDxfDuplicates(out.content).entities[0]!.layer).toBe('POINTS');
 });
 it('creates a point if its original copy is excluded by another selection',()=>{
  const source=file(point+line('B'));const ds=parseDxf(source,'test.dxf');
  const removed=new Set(ds.features.filter(f=>f.sourceEntityId==='entity-1').map(f=>f.id));
  const out=run(source,new Map([['entity-2','convert']]),removed);
  expect(out.keptCount).toBe(1);expect(out.audit.reusedPoints).toBe(0);expect(inspectDxfDuplicates(out.content).entities[0]!.type).toBe('POINT');
 });
 it('does not recreate a singleton excluded by area or layer selection',()=>{
  const source=file(line('B')+point);const ds=parseDxf(source,'test.dxf');
  const out=run(source,new Map([['entity-1','convert']]),new Set(ds.features.filter(f=>f.sourceEntityId==='entity-1').map(f=>f.id)));
  expect(out.audit.convertedSingleVertices).toBe(0);expect(out.keptCount).toBe(1);
 });
 it('avoids duplicate points when multiple singletons share exact XYZ',()=>{
  const out=run(file(line('B')+line('C')),new Map([['entity-1','convert'],['entity-2','convert']]));
  expect(out.keptCount).toBe(1);expect(out.audit.convertedSingleVertices).toBe(2);expect(out.audit.reusedPoints).toBe(1);
 });
 it('supports explicit deletion without a point copy and mixed per-row choices',()=>{
  const out=run(file(line('B')+line('C',8)+line('D',9)),new Map([['entity-1','convert'],['entity-2','delete'],['entity-3','keep']]));
  expect(out.keptCount).toBe(2);expect(out.audit.deletedSingleVertices).toBe(1);
  expect(inspectDxfDuplicates(out.content).entities.map(e=>e.type)).toEqual(['POINT','LWPOLYLINE']);
 });
 it('refuses conversion of unsafe geometry',()=>{
  expect(()=>run(file(line('B').replace('70\n0','42\n1\n70\n0')),new Map([['entity-1','convert']]))).toThrow('repair-selection');
 });
});
