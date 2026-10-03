import {expect,it} from 'vitest';
import {projectSelection} from './selectionProjection';
import type {GeoFeature} from '../model';
const feature:GeoFeature={id:'p',kind:'point',layer:'SYNTHETIC',sourceType:'POINT',points:[{x:500000,y:5500000,z:123.456}]};
it('projects UTM coordinates for OSM without changing any source coordinate',()=>{
 const before=JSON.stringify(feature);const map=projectSelection([feature],'EPSG:25832');
 expect(map!.get('p')![0]![1]).toBeCloseTo(9,5);expect(map!.get('p')![0]![0]).toBeCloseTo(49.6525,3);
 expect(JSON.stringify(feature)).toBe(before);
});
it('uses only the supplied subset for the dedicated repair map',()=>{
 expect([...projectSelection([feature],'EPSG:25832')!.keys()]).toEqual(['p']);
});
it('refuses missing, unknown or non-web-mappable projections without silently omitting vertices',()=>{
 expect(projectSelection([feature],null)).toBeNull();expect(projectSelection([feature],'EPSG:0')).toBeNull();
 expect(projectSelection([{...feature,points:[{x:9,y:90,z:0}]}],'EPSG:4326')).toBeNull();
 expect(projectSelection([feature,{...feature,id:'bad',points:[{x:NaN,y:0,z:0}]}],'EPSG:25832')).toBeNull();
});
