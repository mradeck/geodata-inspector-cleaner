import type { DxfDuplicateCheck, DxfSourceEntity } from '../duplicates/dxfDuplicates';
export const ANNOTATION_TYPES = new Set(['TEXT','MTEXT','ATTRIB','ATTDEF']);
const val=(e:DxfSourceEntity,c:number)=>e.tags.find(t=>t.code===c)?.value.trim();
function anchor(e:DxfSourceEntity){
 const x=val(e,10),y=val(e,20); if(!x||!y||!Number.isFinite(Number(x))||!Number.isFinite(Number(y)))return null;
 return JSON.stringify([Number(x),Number(y),val(e,67)??'0',val(e,410)??'']);
}
/** No nearest-neighbour guesses: labels follow explicit point references or exact XY anchors.
 * All point copies at the anchor must be removed before their shared label can follow. */
export function pointCompanions(check:DxfDuplicateCheck){
 const points=check.entities.filter(e=>e.type==='POINT');
 const handles=new Map(points.filter(p=>p.handle).map(p=>[p.handle!.toUpperCase(),p.id]));
 const anchors=new Map<string,string[]>();
 for(const p of points){const key=anchor(p);if(key)anchors.set(key,[...(anchors.get(key)??[]),p.id]);}
 const links=new Map<string,string[]>(); const unresolved:string[]=[];
 for(const e of check.entities.filter(e=>ANNOTATION_TYPES.has(e.type))){
  const refs=[...new Set(e.tags.filter(t=>[330,340,350,360,1005].includes(t.code)).map(t=>handles.get(t.value.trim().toUpperCase())).filter((id):id is string=>!!id))];
  const owners=refs.length?refs:anchors.get(anchor(e)??'');
  if(owners?.length)links.set(e.id,owners);else unresolved.push(e.id);
 }
 return {links,unresolved};
}
