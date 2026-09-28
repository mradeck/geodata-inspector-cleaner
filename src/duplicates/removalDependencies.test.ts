import { describe, expect, it } from 'vitest';
import { createEntityRemovalExport, inspectDxfDuplicates } from './dxfDuplicates';
const tags = (...v: (number|string)[]) => v.join('\n')+'\n';
const section = (name: string, content: string) => tags(0,'SECTION',2,name)+content+tags(0,'ENDSEC');
const viewport = tags(0,'VIEWPORT',5,'A',102,'{ACAD_XDICTIONARY',360,'D',102,'}',330,'B',100,'AcDbEntity',8,'0',100,'AcDbViewport',10,1,20,2);
const dictionary = tags(0,'DICTIONARY',5,'D',330,'A',100,'AcDbDictionary',3,'data',360,'E');
const child = tags(0,'XRECORD',5,'E',330,'D',100,'AcDbXrecord',1,'owned metadata');
const layout = tags(0,'LAYOUT',5,'F',330,'B',100,'AcDbLayout',331,'A');
function remove(source: string) { const check=inspectDxfDuplicates(source);return createEntityRemovalExport(check,new Set([check.entities[0]!.id])); }
describe('source-preserving removal dependencies',()=>{
 it('removes owned metadata recursively and clears the active viewport without touching shared resources',()=>{
  const shared=tags(0,'XRECORD',5,'C',330,'B',100,'AcDbXrecord',1,'shared');
  const source=section('ENTITIES',viewport)+section('OBJECTS',dictionary+child+layout+shared)+tags(0,'EOF');
  const out=remove(source);
  expect(out.removedOwnedObjectCount).toBe(2);
  expect(out.content).toContain(layout.replace('331\nA','331\n0'));
  expect(out.content).toContain(shared);expect(out.content).not.toContain('owned metadata');
 });
 it('keeps the whole entity when an unknown reference targets its owned metadata',()=>{
  const source=section('ENTITIES',viewport)+section('OBJECTS',dictionary+child+tags(0,'XRECORD',5,'C',330,'B',100,'AcDbXrecord',340,'E'))+tags(0,'EOF');
  expect(()=>remove(source)).toThrow('invalid-selection');
 });
 it('does not accept ambiguous handles',()=>{
  expect(()=>remove(section('ENTITIES',viewport+viewport)+tags(0,'EOF'))).toThrow('invalid-selection');
 });
 it('repairs block backlinks, sort pairs and the named hierarchy index while retaining other entries',()=>{
  const insert=tags(0,'INSERT',5,'A',330,'B',100,'AcDbEntity',8,'0',100,'AcDbBlockReference',2,'Title');
  const block=tags(0,'BLOCK_RECORD',5,'B',330,'1',100,'AcDbBlockTableRecord',2,'Title',102,'{BLKREFS',331,'A',331,'C',102,'}');
  const sort=tags(0,'SORTENTSTABLE',5,'S',330,'D',100,'AcDbSortentsTable',330,'B',331,'A',5,'99',331,'C',5,'100');
  const index=tags(0,'DICTIONARY',5,'I',330,'0',100,'AcDbDictionary',3,'ASEBlockHierarchyIndexRecord',350,'J');
  const record=tags(0,'XRECORD',5,'J',330,'I',100,'AcDbXrecord',280,1,330,'A',330,'C');
  const out=remove(section('TABLES',block)+section('ENTITIES',insert)+section('OBJECTS',sort+index+record)+tags(0,'EOF'));
  expect(out.content).not.toContain('331\nA');expect(out.content).not.toContain('5\n99');
  expect(out.content).toContain('331\nC\n5\n100');expect(out.content).toContain(record.replace('330\nA\n',''));
 });
 it('does not treat arbitrary XRECORD payloads or reactor links as removable index members',()=>{
  const insert=tags(0,'INSERT',5,'A',100,'AcDbEntity',8,'0',100,'AcDbBlockReference',2,'Title');
  for(const ref of [tags(0,'XRECORD',5,'B',100,'AcDbXrecord',330,'A'),tags(0,'BLOCK_RECORD',5,'B',102,'{ACAD_REACTORS',331,'A',102,'}',100,'AcDbBlockTableRecord',2,'Title')]) {
   expect(()=>remove(section('ENTITIES',insert)+section('OBJECTS',ref)+tags(0,'EOF'))).toThrow('invalid-selection');
  }
 });
 it('removes owned fields from FIELDLIST without deleting other field registrations',()=>{
  const field=tags(0,'FIELD',5,'E',330,'D',100,'AcDbField',1,'value');
  const list=tags(0,'FIELDLIST',5,'F',330,'B',100,'AcDbIdSet',90,0,330,'E',330,'AA');
  const out=remove(section('ENTITIES',viewport)+section('OBJECTS',dictionary+field+list)+tags(0,'EOF'));
  expect(out.content).toContain(list.replace('330\nE\n',''));expect(out.content).not.toContain('AcDbField\n');
 });
});
