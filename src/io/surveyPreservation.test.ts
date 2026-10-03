import { describe,it,expect } from 'vitest';
import { parseDxf } from './parseDxf';
import { createPlannedDxf } from './exportPlan';
import { inspectDxfDuplicates } from '../duplicates/dxfDuplicates';
import { buildDefaultSelection,summarizeLayers,filterFeatures,selectionKey } from '../analysis/layerFilter';
const tags=(...v:(number|string)[])=>v.join('\n')+'\n';
const point=(h='A',x=100)=>tags(0,'POINT',5,h,8,'SURVEY',10,x,20,200,30,'456.123456789',1001,'SURVEYAPP',1000,'Code Name');
const label=(h:string,text:string,x=100)=>tags(0,'MTEXT',5,h,8,'LABELS',10,x,20,200,30,0,1,text);
const file=(entities:string,blocks='')=>tags(0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1032',0,'ENDSEC')+(blocks?tags(0,'SECTION',2,'BLOCKS')+blocks+tags(0,'ENDSEC'):'')+tags(0,'SECTION',2,'ENTITIES')+entities+tags(0,'ENDSEC',0,'EOF');
const plan={duplicateIds:new Set<string>(),removedFeatureIds:new Set<string>(),hatchOutlines:false};
describe('survey preservation and point companions',()=>{
 it('preserves all measured XYZ, labels and application tags by default, byte for byte',()=>{
  const source=file(point()+label('B','Name')+label('C','Code')+label('D','456.123'));
  const d=parseDxf(source,'synthetic.dxf');const kept=filterFeatures(d.features,buildDefaultSelection(summarizeLayers(d)));
  expect(kept).toHaveLength(4);expect(createPlannedDxf(d,plan).content).toBe(source);
 });
 it('removes known companion labels when their point is explicitly removed, retaining unrelated labels',()=>{
  const d=parseDxf(file(point()+label('B','Name')+label('C','Code')+label('D','Height')+label('E','Unrelated',105)),'test.dxf');
  const out=createPlannedDxf(d,{...plan,removedEntityIds:new Set(['entity-1'])});
  expect(out.audit.removedCompanions).toHaveLength(3);expect(out.audit.unresolvedCompanions).toEqual(['entity-5']);
  expect(inspectDxfDuplicates(out.content).entities.map(e=>e.handle)).toEqual(['E']);
  expect(out.preview.removedEntityIds).toHaveLength(4);
 });
 it('retains companions if another point copy at the same anchor survives',()=>{
  const d=parseDxf(file(point()+point('B')+label('C','Name')),'test.dxf');
  const out=createPlannedDxf(d,{...plan,removedEntityIds:new Set(['entity-1'])});
  expect(out.audit.removedCompanions).toHaveLength(0);expect(out.keptCount).toBe(2);
 });
 it('keeps annotation filters separate from true points and follows excluded points with their labels',()=>{
  const d=parseDxf(file(point()+label('B','Name')+label('C','Other',105)),'test.dxf');
  const selection=buildDefaultSelection(summarizeLayers(d));selection.delete(selectionKey('SURVEY','point'));
  const kept=new Set(filterFeatures(d.features,selection).map(f=>f.id));
  const out=createPlannedDxf(d,{...plan,removedFeatureIds:new Set(d.features.filter(f=>!kept.has(f.id)).map(f=>f.id))});
  expect(out.audit.removedCompanions).toHaveLength(1);expect(out.keptCount).toBe(1);
 });
 it('geometry-only drops labels on demand but keeps original geometric Z',()=>{
  const source=file(point()+label('B','Name')+label('C','Height'));
  const d=parseDxf(source,'test.dxf');const out=createPlannedDxf(d,{...plan,compact:true,stripAnnotations:true});
  const e=inspectDxfDuplicates(out.content).entities;expect(e).toHaveLength(1);expect(e[0]!.type).toBe('POINT');
  expect(e[0]!.tags.find(t=>t.code===30)?.value.trim()).toBe('456.123456789');
  expect(out.audit.removedAnnotations).toBe(2);
  expect(createPlannedDxf(d,plan).content).toBe(source);
 });
 it('strips block labels and INSERT attributes without destroying block geometry or POLYLINE sequences',()=>{
  const block=tags(0,'BLOCK',5,'B0',8,'0',2,'MARK',70,0,10,0,20,0,30,0)+point('B1')+label('B2','Block name')+tags(0,'ENDBLK',5,'B3',8,'0');
  const insert=tags(0,'INSERT',5,'C0',8,'SURVEY',2,'MARK',66,1,10,100,20,200,30,456,0,'ATTRIB',5,'C1',8,'LABELS',10,100,20,200,30,456,1,'Attribute',2,'NAME',0,'SEQEND',5,'C2',8,'SURVEY');
  const d=parseDxf(file(insert,block),'test.dxf');const out=createPlannedDxf(d,{...plan,compact:true,stripAnnotations:true});
  expect(out.audit.removedAnnotations).toBe(2);expect(out.content).not.toContain('Attribute');expect(out.content).not.toContain('Block name');
  expect(inspectDxfDuplicates(out.content).entities.map(e=>e.type)).toEqual(['INSERT']);
  expect(out.content).toContain('456.123456789');
 });
});
