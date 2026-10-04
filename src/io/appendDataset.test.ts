import { describe, it, expect } from "vitest";
import { appendDataset } from "./appendDataset";
import { importGeoJson } from "./importGeoJson";
import { exportFeaturesAsDxf } from "./exportCleaned";
import { parseDxf } from "./parseDxf";
import { createPlannedDxf } from "./exportPlan";
import { mergeDxf } from "./mergeDxf";
const geo = () => importGeoJson(JSON.stringify({type:"Point",coordinates:[9,48,17]}),"area.geojson");
const dxf = (x=500001) => parseDxf(exportFeaturesAsDxf([{id:"1",layer:"Survey",sourceType:"POINT",kind:"point",points:[{x,y:5316000,z:42}]}],"EPSG:25832"),"day.dxf");
describe("all import orders",()=>{
  it.each([['geo','dxf'],['dxf','geo'],['dxf','dxf'],['geo','geo']])("adds %s then %s",(first,second)=>{
    const a=first==='geo'?geo():dxf(); const b=second==='geo'?geo():dxf(500002);
    const merged=appendDataset(a,b,"EPSG:25832");
    expect(merged.features).toHaveLength(2);
    expect(merged.importedFileNames).toEqual([a.fileName,b.fileName]);
    const points=merged.features.flatMap(f=>f.points);
    for(const point of [...a.features,...b.features].flatMap(f=>f.points)) expect(points.some(p=>Math.abs(p.x-point.x)<1e-6&&Math.abs(p.y-point.y)<1e-6&&p.z===point.z)).toBe(true);
    if(merged.dxfDuplicates){
      const output=createPlannedDxf(merged,{duplicateIds:new Set(),removedFeatureIds:new Set(),hatchOutlines:false});
      expect(parseDxf(output.content,"export.dxf").features).toHaveLength(2);
      const reloaded=parseDxf(merged.dxfDuplicates.source,'combined.dxf');
      expect(reloaded.features).toHaveLength(2);
      const handles=[...merged.dxfDuplicates.source.matchAll(/(?:^|\n)(?:5|105)\n([^\n]+)/g)].map(m=>m[1]);
      expect(new Set(handles).size).toBe(handles.length);
    }
  });
  it("retains three survey days with overlapping handles",()=>{
    const merged=appendDataset(appendDataset(dxf(),dxf(500002),'EPSG:25832'),dxf(500003),'EPSG:25832');
    expect(merged.features.map(f=>f.points[0]!.x)).toEqual([500001,500002,500003]);
    expect(merged.dxfDuplicates!.error).toBeNull();
  });
  it("rejects mismatched source CRS and units without replacing data",()=>{
    const first=dxf(), other=dxf(); other.declaredCrs='EPSG:25833';
    expect(()=>appendDataset(first,other,'EPSG:25832')).toThrow('append-crs');
    const a=first.dxfDuplicates!.source;
    expect(()=>mergeDxf(a,a.replace('$INSUNITS\n70\n6','$INSUNITS\n70\n4'))).toThrow('append-units');
    expect(first.features).toHaveLength(1);
  });
  it("keeps native blocks and rewrites colliding names and handles",()=>{
    const tags=(...values:(string|number)[])=>values.join('\n')+'\n';
    const fixture=(offset:number)=>tags(0,'SECTION',2,'BLOCKS',0,'BLOCK',5,'A',2,'SurveySymbol',70,0,10,0,20,0,30,0,0,'POINT',5,'B',8,'0',10,offset,20,0,30,3,0,'ENDBLK',5,'C',0,'ENDSEC',0,'SECTION',2,'ENTITIES',0,'INSERT',5,'D',8,'0',2,'SurveySymbol',10,100,20,200,30,0,0,'ENDSEC',0,'EOF');
    const out=mergeDxf(fixture(1),fixture(2));
    expect(out).toContain('2\nSurveySymbol__2\n');
    expect(out.match(/0\nINSERT\n/g)).toHaveLength(2);
    expect(out.match(/0\nBLOCK\n/g)).toHaveLength(2);
    expect(out).toContain('10\n2\n20\n0\n30\n3');
  });
});
