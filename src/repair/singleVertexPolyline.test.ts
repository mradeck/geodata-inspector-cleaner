import { describe, expect, it } from 'vitest';
import { exportSingleVertexRepair, inspectSingleVertexPolylines } from './singleVertexPolyline';
import { parseDxf } from '../io/parseDxf';
import { inspectDataset } from '../analysis/inspectDataset';
const tags = (...v:(number|string)[]) => v.join('\n')+'\n';
const point = (h='A',z=3,extra='') => tags(0,'POINT',5,h,8,'POINTS',10,1,20,2,30,z)+extra;
const line = (h='B',z=3,extra='') => tags(0,'LWPOLYLINE',5,h,8,'LINES',90,1,10,1,20,2,38,z)+extra;
const file = (entities:string,objects='') => tags(0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1032',0,'ENDSEC',0,'SECTION',2,'ENTITIES')+entities+tags(0,'ENDSEC')+(objects ? tags(0,'SECTION',2,'OBJECTS')+objects+tags(0,'ENDSEC') : '')+tags(0,'EOF');
const first = (source:string) => inspectSingleVertexPolylines(source).findings[0]!;
describe('single-vertex source repair',()=>{
 it('removes only selected lines while retaining matching points on another layer and all surrounding text',()=>{
  const extra=tags(0,'MTEXT',5,'C',8,'LABELS',10,1,20,2,30,3,1,'Survey');
  const source=file(point()+line()+extra);const check=inspectSingleVertexPolylines(source);
  expect(check.findings).toHaveLength(1);expect(check.findings[0]!.blocked).toBeNull();
  expect(check.findings[0]!.pointCopies).toEqual([{id:'entity-1',handle:'A',layer:'POINTS'}]);
  const out=exportSingleVertexRepair(check,['entity-2']);expect(out.source).toBe(file(point()+extra));expect(out.changes).toHaveLength(1);expect(out.remainingCount).toBe(2);
 });
 it('keeps the original source for an empty selection and rejects unknown IDs or forged findings',()=>{
  const source=file(point()+line());const report=inspectSingleVertexPolylines(source);
  expect(exportSingleVertexRepair(report,[]).source).toBe(source);
  expect(()=>exportSingleVertexRepair(report,['wrong'])).toThrow('repair-selection');
  const blocked=inspectSingleVertexPolylines(file(line()));blocked.findings[0]!.blocked=null;
  expect(()=>exportSingleVertexRepair(blocked,['entity-1'])).toThrow('repair-selection');
 });
 it.each([3.000000001,4])('does not use a coordinate tolerance (Z=%s)',z=>{
  expect(first(file(point('A',z)+line())).blocked).toBe('no-point-copy');
 });
 it('matches numeric representations exactly, including omitted zero elevation',()=>{
  const source=file(point('A',0).replace('10\n1','10\n1.0')+line('B',0).replace('38\n0\n',''));
  expect(first(source).blocked).toBeNull();
 });
 it.each(['90\n2\n',''])('blocks inconsistent or missing counts',replacement=>{
  expect(first(file(point()+line().replace('90\n1\n',replacement))).blocked).toBe('vertex-count');
 });
 it.each(['NaN','Infinity','0x1',''])('blocks malformed coordinates %s',x=>{
  expect(first(file(point()+line().replace('10\n1\n',`10\n${x}\n`))).blocked).toBe('coordinates');
 });
 it('blocks missing or repeated Y tags',()=>{
  expect(first(file(point()+line().replace('20\n2\n','')))).toMatchObject({blocked:'coordinates'});
  expect(first(file(point()+line('B',3,tags(20,2))))).toMatchObject({blocked:'coordinates'});
 });
 it('blocks nonstandard extrusion on the line or matching point',()=>{
  expect(first(file(point()+line('B',3,tags(230,-1)))).blocked).toBe('extrusion');
  expect(first(file(point('A',3,tags(230,-1))+line())).blocked).toBe('no-point-copy');
 });
 it.each([39,40,41,42,43])('does not treat width/bulge/thickness code %s as an ordinary singleton',code=>{
  expect(first(file(point()+line('B',3,tags(code,1)))).blocked).toBe('geometry');
 });
 it.each([330,340,350,360,390,391,395,399,480,481,1005])('blocks incoming external handle references (%s)',code=>{
  const source=file(point()+line(),tags(0,'XRECORD',5,'D',100,'AcDbXrecord',code,'b'));
  expect(first(source).blocked).toBe('referenced');
 });
 it('also blocks IDBUFFER membership even though ordinary duplicate cleanup can rewrite it',()=>{
  expect(first(file(point()+line(),tags(0,'IDBUFFER',5,'D',100,'AcDbIdBuffer',330,'B'))).blocked).toBe('referenced');
 });
 it('blocks ambiguous handles and points in a different drawing space',()=>{
  expect(first(file(point('B')+line())).blocked).toBe('referenced');
  expect(first(file(point('A',3,tags(67,1,410,'Layout'))+line())).blocked).toBe('no-point-copy');
 });
 it.each(['\n','\r\n'])('preserves line endings and classic compound entities (%j)',eol=>{
  const valid=tags(0,'LWPOLYLINE',5,'D',8,'LINES',90,2,10,1,20,2,10,4,20,5);
  const classic=tags(0,'POLYLINE',5,'E',8,'LINES',66,1,70,8,0,'VERTEX',5,'F',330,'E',10,4,20,5,30,6,0,'SEQEND',5,'10',330,'E');
  const source=file(point()+line()+valid+classic).replaceAll('\n',eol);
  const report=inspectSingleVertexPolylines(source);expect(report.findings).toHaveLength(1);
  expect(exportSingleVertexRepair(report,['entity-2']).source).toBe(file(point()+valid+classic).replaceAll('\n',eol));
 });
 it.each(['é','\uFEFF','\ufffd'])('refuses non-ASCII rather than transcoding %j',text=>{
  const report=inspectSingleVertexPolylines(file(point()+line()+tags(999,text)));expect(report.error).toBe('encoding');expect(()=>exportSingleVertexRepair(report,[])).toThrow('repair-encoding');
 });
 it('refuses malformed sections and binary data',()=>{
  for(const source of ['AutoCAD Binary DXF\r\n\x1a\x00',file(point()+line()).replace('0\nENDSEC\n','')]) expect(inspectSingleVertexPolylines(source).error).toBeTruthy();
 });
 it('keeps findings in the dataset and inspection even if preview discards invalid coordinates',()=>{
  const dataset=parseDxf(file(line().replace('20\n2\n','')),'synthetic.dxf');
  expect(dataset.singleVertexPolylines?.findings).toHaveLength(1);
  expect(inspectDataset(dataset).findings.some(f=>f.category==='dxf-single-vertex')).toBe(true);
 });
});
