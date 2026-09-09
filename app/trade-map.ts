import type * as Leaflet from 'leaflet';
import type {GeoJsonObject} from 'geojson';
import { locations, routes, ports } from './trade-data';
const colors={energy:'#ffc373',trade:'#4ad7d1',conflict:'#fb839a'};
export const LABEL_ZOOM=7;
export async function createTradeMap(host:HTMLDivElement,onError:(message:string)=>void,signal:AbortSignal){
 const [L,response]=await Promise.all([import('leaflet'),fetch('/world-land.geojson',{signal})]);
 if(!response.ok)throw new Error('Coastline data could not load.');
 const land=await response.json() as GeoJsonObject;if(signal.aborted)return;
 const m=L.map(host,{zoomControl:false,minZoom:2,maxZoom:12,worldCopyJump:true}).setView([25.5,53],5);
 L.control.zoom({position:'bottomright'}).addTo(m);
 m.createPane('coastline');m.getPane('coastline')!.style.zIndex='250';
 const coast=L.geoJSON(land,{pane:'coastline',interactive:false,style:{color:'#365567',weight:.8,fillColor:'#172c3e',fillOpacity:1}}).addTo(m);
 m.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{minZoom:LABEL_ZOOM,maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
 tiles.on('tileerror',()=>onError('Some detailed map tiles could not load. Check your connection or retry.'));tiles.on('tileload',()=>onError(''));
 const routeLayer=L.layerGroup().addTo(m),portLayer=L.layerGroup().addTo(m);
 routes.forEach(r=>L.polyline(r.points,{color:colors[r.kind],weight:2.5,opacity:.9,dashArray:'7 9',className:'trade-route '+r.kind}).bindTooltip(r.name+' · illustrative').addTo(routeLayer));
 let closeTimer:ReturnType<typeof setTimeout>|undefined;let active:Leaflet.Marker|undefined;
 const cancelClose=()=>{if(closeTimer)clearTimeout(closeTimer);active?.getPopup()?.getElement()?.classList.remove('popup-leaving');};
 const close=()=>{cancelClose();active?.closePopup();active=undefined;};
 const scheduleClose=()=>{cancelClose();const container=active?.getPopup()?.getElement();container?.classList.add('popup-leaving');closeTimer=setTimeout(()=>{if(container?.matches(':hover')||container?.contains(document.activeElement)){cancelClose();return;}close();},160);};
 const markers=locations.map((p,i)=>{
 const marker=L.marker(p.point,{alt:p.name,icon:L.divIcon({className:'atlas-marker',html:`<span style="--pin:${colors[p.kind]}">${String(i+1).padStart(2,'0')}</span>`,iconSize:[30,30],iconAnchor:[15,15]})}).addTo(m);
 const content=document.createElement('article');content.className='hover-description';
 const add=(tag:string,text:string,className?:string)=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;content.appendChild(el);return el;};
 add('div',p.region,'popup-region');add('h2',p.name);add('div',p.goods.join(' · '),'popup-goods');add('p',p.description);add('h3',p.kind==='conflict'?'War & trade':'Trade impact');add('p',p.impact,'popup-impact');
 const source=add('a','Source: '+p.sourceName,'popup-source') as HTMLAnchorElement;source.href=p.source;source.target='_blank';source.rel='noreferrer';
 marker.bindPopup(content,{className:'trade-popup',closeButton:false,autoPan:false,maxWidth:260,minWidth:220,maxHeight:Math.max(140,Math.min(240,m.getSize().y/2-60)),offset:[0,-10]});
 const open=()=>{cancelClose();active=marker;marker.openPopup();};
 marker.on('mouseover',open);marker.on('mouseout',scheduleClose);
 marker.on('popupopen',()=>{cancelClose();active=marker;const el=marker.getPopup()?.getElement();if(el){el.onpointerenter=cancelClose;el.onpointerleave=scheduleClose;el.addEventListener('focusin',cancelClose);el.addEventListener('focusout',scheduleClose);}});
 const icon=marker.getElement();icon?.addEventListener('focus',open);icon?.addEventListener('blur',scheduleClose);
 return marker;
 });
 const portMarkers=ports.map(([name,lat,lon])=>({name,marker:L.circleMarker([lat,lon],{radius:4,color:'#fb839a',weight:2,fillColor:'#102338',fillOpacity:1}).addTo(portLayer)}));
 const updateLabels=()=>{
 const detailed=m.getZoom()>=LABEL_ZOOM;
 if(detailed){if(m.hasLayer(coast))coast.remove();if(!m.hasLayer(tiles))tiles.addTo(m);}else{if(m.hasLayer(tiles))tiles.remove();if(!m.hasLayer(coast))coast.addTo(m);onError('');}
 markers.forEach((marker,i)=>{if(detailed&&!marker.getTooltip())marker.bindTooltip(locations[i].name,{permanent:true,direction:'right',offset:[18,0],className:'zoom-label'});else if(!detailed&&marker.getTooltip())marker.unbindTooltip();});
 portMarkers.forEach(({name,marker})=>{if(detailed&&!marker.getTooltip())marker.bindTooltip(name);else if(!detailed&&marker.getTooltip())marker.unbindTooltip();});
 };
 m.on('zoomend',updateLabels);m.on('movestart',close);updateLabels();
 const resize=new ResizeObserver(()=>m.invalidateSize());resize.observe(host);
 m.on('unload',()=>{cancelClose();resize.disconnect();});
 return {map:m,routeLayer,portLayer};
}


