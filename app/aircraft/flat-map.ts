import type {GeoJsonObject} from 'geojson';
import type {Flight} from './data';
export async function createAircraftMap(host:HTMLDivElement,onHover:(f:Flight|null)=>void,signal:AbortSignal,onPick:(f:Flight)=>void){
 const [L,response]=await Promise.all([import('leaflet'),fetch('/world-land-hires.geojson',{signal})]);
 if(!response.ok)throw new Error('Map data unavailable');
 const land=await response.json() as GeoJsonObject;if(signal.aborted)return;
 const map=L.map(host,{zoomControl:false,preferCanvas:true,minZoom:3,maxZoom:11,worldCopyJump:true,attributionControl:false}).setView([25.25,55.36],6);
 L.geoJSON(land,{interactive:false,style:{color:'#395d70',weight:1,fillColor:'#152d3d',fillOpacity:1}}).addTo(map);
 let selected:string|null=null;
 const markers=new Map<string,{marker:import('leaflet').Marker;flight:Flight}>();
 const icon=(f:Flight)=>L.divIcon({className:'flight-pin'+(selected===f.id?' flight-pin-selected':''),iconSize:[32,32],iconAnchor:[16,16],html:`<svg viewBox="0 0 32 32" style="transform:rotate(${f.heading??0}deg)" aria-hidden="true"><path d="M16 2c1.2 0 1.6 2 1.6 4v6l11 7v2l-11-3v7l4 3v2L16 28l-5.6 2v-2l4-3v-7l-11 3v-2l11-7V6c0-2 .4-4 1.6-4Z"/></svg>`});
 const focus=(lat:number,lon:number,zoom=6)=>{map.stop();map.flyTo([lat,lon],zoom,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches,duration:.55,easeLinearity:.3});};
 const resize=new ResizeObserver(()=>map.invalidateSize({pan:false}));resize.observe(host);
 signal.addEventListener('abort',()=>{resize.disconnect();map.remove();},{once:true});
 return {focus,zoom:(factor:number)=>map.setZoom(map.getZoom()+(factor<1?1:-1)),select:(id:string|null)=>{selected=id;markers.forEach(({marker,flight})=>marker.setIcon(icon(flight)));},update:(flights:Flight[])=>{
 const ids=new Set(flights.map(f=>f.id));markers.forEach(({marker},id)=>{if(!ids.has(id)){marker.remove();markers.delete(id);}});
 for(const f of flights){const existing=markers.get(f.id);if(existing){existing.flight=f;existing.marker.setLatLng([f.lat,f.lon]).setIcon(icon(f));}else{const marker=L.marker([f.lat,f.lon],{icon:icon(f),title:f.callsign,alt:f.callsign}).addTo(map);const entry={marker,flight:f};marker.on('mouseover',()=>onHover(entry.flight));marker.on('mouseout',()=>onHover(null));marker.on('click',()=>onPick(entry.flight));markers.set(f.id,entry);}}
 }};
}

