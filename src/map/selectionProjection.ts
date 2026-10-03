import type { GeoFeature } from '../model';
import { projectPositionToMap } from '../geo/mapProjection';
/** An invalid CRS or vertex must not silently hide geometry in the selection map. */
export function projectSelection(features:readonly GeoFeature[],crs:string|null):Map<string,[number,number][]>|null {
 if(!crs)return null;
 const projected=new Map<string,[number,number][]>();
 for(const feature of features){
  const points:[number,number][]=[];
  for(const p of feature.points){const geo=projectPositionToMap(p,crs);if(!geo)return null;points.push([geo.lat,geo.lon]);}
  projected.set(feature.id,points);
 }
 return projected;
}
