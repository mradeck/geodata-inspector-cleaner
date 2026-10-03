import L from 'leaflet';
import type { GeoFeature } from '../model';
import { t } from '../i18n';
import { projectSelection } from './selectionProjection';
import { OSM_TILE_URL } from './osmClusterMap';
/** Optional OSM display projection; original geometry and export coordinates remain unchanged. */
export class SelectionMap {
 private map:L.Map;
 private layers=L.layerGroup();
 private bounds:L.LatLngBounds|null=null;
 private mode='local';
 private tiles:L.TileLayer|null=null;
 constructor(private container:HTMLElement){ this.map=this.createMap(false); }
 private createMap(osm:boolean){
  const map=L.map(this.container,{crs:osm?L.CRS.EPSG3857:L.CRS.Simple,minZoom:osm?0:-24,maxZoom:osm?22:24,attributionControl:osm,preferCanvas:true}).setView([0,0],0);
  map.attributionControl?.setPrefix(false);
  this.layers=L.layerGroup().addTo(map);
  this.container.classList.toggle('has-osm',osm);
  return map;
 }
 fit(){this.map.invalidateSize();if(this.bounds)this.map.fitBounds(this.bounds.pad(0.12),{animate:false,maxZoom:this.mode==='local'?5:19});}
 render(features:GeoFeature[],removed:ReadonlySet<string>,converted:ReadonlySet<string>,fit:boolean,toggle?:((id:string)=>void),background:{osm:boolean;crs:string|null}={osm:false,crs:null}){
  const projected=background.osm?projectSelection(features,background.crs):null;
  const osm=Boolean(projected&&features.length);
  const mode=osm?background.crs!:'local';
  if(mode!==this.mode){this.map.remove();this.tiles=null;this.mode=mode;this.map=this.createMap(osm);fit=true;}
  this.layers.clearLayers();const points:L.LatLngTuple[]=[];
  for(const f of [...features].sort((a,b)=>Number(a.sourceType==='POINT')-Number(b.sourceType==='POINT'))){
   const coords=projected?.get(f.id)??f.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>[p.y,p.x] as L.LatLngTuple);if(!coords.length)continue;
   for(const p of coords)points.push(p);
   const id=f.sourceEntityId??f.id;
   const state=(removed.has(id)||removed.has(f.id))?'removed':converted.has(id)?'converted':'retained';
   const color={removed:'#e34761',converted:'#358bff',retained:'#12a87a'}[state];
   const style={color,weight:2,opacity:state==='removed'?0.6:1,dashArray:state==='removed'?'5 4':undefined};
   const layer=coords.length===1?L.circleMarker(coords[0]!,{...style,radius:f.kind==='anchor'?4:7,fillOpacity:state==='removed'?0.15:0.8}):L.polyline(coords,style);
   const tooltip=document.createElement('span');tooltip.textContent=`${f.sourceType} · ${f.sourceHandle??id} · ${f.layer} · ${t(`selection.${state}`)} · XYZ ${f.points[0]!.x} / ${f.points[0]!.y} / ${f.points[0]!.z}`;
   layer.bindTooltip(tooltip);layer.addTo(this.layers);
   if(toggle)layer.on('click',()=>toggle(id));
  }
  this.bounds=points.length?L.latLngBounds(points):null;
  if(fit)this.fit();else this.map.invalidateSize();
  // Add tiles only after fitting the actual geometry; no initial world-map request.
  if(osm&&!this.tiles)this.tiles=L.tileLayer(OSM_TILE_URL,{maxNativeZoom:19,maxZoom:22,updateWhenIdle:true,keepBuffer:0,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(this.map);
  this.map.zoomControl?.getContainer()?.querySelector('.leaflet-control-zoom-in')?.setAttribute('aria-label',t('map.zoomIn'));
  this.map.zoomControl?.getContainer()?.querySelector('.leaflet-control-zoom-out')?.setAttribute('aria-label',t('map.zoomOut'));
  return osm;
 }
}
