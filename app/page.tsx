'use client';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Globe2, ArrowUpRight, Anchor, Layers, Route, Navigation, ChevronRight, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { locations } from './trade-data';
import { createTradeMap } from './trade-map';
import type * as Leaflet from 'leaflet';

export default function Home(){
 const host=useRef<HTMLDivElement>(null), map=useRef<Leaflet.Map|null>(null), routeLayer=useRef<Leaflet.LayerGroup|null>(null), portLayer=useRef<Leaflet.LayerGroup|null>(null);
 const [selected,setSelected]=useState('hormuz'),[ready,setReady]=useState(false),[error,setError]=useState(''),[showRoutes,setShowRoutes]=useState(true),[showPorts,setShowPorts]=useState(true);
 const location=locations.find(x=>x.id===selected)!;
 useEffect(()=>{
 const lifecycle=new AbortController();let localMap:Leaflet.Map|undefined;
 if(host.current)createTradeMap(host.current,setError,lifecycle.signal).then(result=>{
 if(!result)return;if(lifecycle.signal.aborted){result.map.remove();return;}
 localMap=result.map;map.current=result.map;routeLayer.current=result.routeLayer;portLayer.current=result.portLayer;setReady(true);
 }).catch(()=>{if(!lifecycle.signal.aborted)setError('The map could not start. Reload to try again.');});
 return()=>{lifecycle.abort();localMap?.remove();map.current=null;};
 },[]);
 useEffect(()=>{if(ready)map.current?.flyTo(location.point,location.zoom,{duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:.8});},[selected,ready,location]);
 useEffect(()=>{if(!map.current||!routeLayer.current)return;showRoutes?routeLayer.current.addTo(map.current):routeLayer.current.remove();},[showRoutes,ready]);
 useEffect(()=>{if(!map.current||!portLayer.current)return;showPorts?portLayer.current.addTo(map.current):portLayer.current.remove();},[showPorts,ready]);
 useEffect(()=>{
 const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
 if(!context?.registerTool)return;
 const lifecycle=new AbortController();
 try{Promise.resolve(context.registerTool({name:'navigate_trade_location',description:'Select a trade chokepoint or Ukraine and Black Sea context on the map.',inputSchema:{type:'object',properties:{id:{type:'string',enum:locations.map(p=>p.id)}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{
 if(!input||typeof input!=='object'||!('id' in input)||typeof input.id!=='string')throw new Error('A location id is required.');
 const p=locations.find(x=>x.id===input.id);if(!p)throw new Error('Unknown location.');
 if(!map.current)throw new Error('Map is not ready.');
 flushSync(()=>setSelected(p.id));map.current.stop();map.current.setView(p.point,p.zoom,{animate:false});
 return {id:p.id,name:p.name,description:p.description,liveVessels:false};
 }},{signal:lifecycle.signal})).catch(()=>{});}catch{}
 return()=>lifecycle.abort();
 },[]);
 return <main className="atlas">
 <header className="topbar"><div className="brand"><Globe2 size={27}/><span>TRADE<span className="brand-light">ATLAS</span></span><span className="edition">EXPLORER / 01</span></div><div className="feed"><Radio size={15}/><span>AIS vessels · not connected</span></div></header>
 <div className="workspace"><aside className="sidebar"><div className="sidebar-intro"><p className="eyebrow">THE WORLD IN TRANSIT</p><h1>Where trade<br/>meets geography.</h1><p>Explore the passages that connect global energy, goods, and food.</p></div>
 <div className="list-title"><span>STRATEGIC PASSAGES</span><span>08</span></div><nav aria-label="Trade chokepoints" className="locations">{locations.map((p,i)=><Button key={p.id} variant="ghost" className={'place '+(selected===p.id?'active':'')} onClick={()=>setSelected(p.id)} aria-pressed={selected===p.id}><span className={'place-number '+p.kind}>{String(i+1).padStart(2,'0')}</span><span className="place-copy"><strong>{p.name}</strong><small>{p.region}</small></span><ChevronRight size={15}/></Button>)}</nav>
 <div className="sidebar-note"><Anchor size={18}/><p>Hover over a marker for details. Zoom in for place names. On touch screens, tap a marker.</p></div></aside>
 <section className="map-stage" aria-label="Interactive trade route map"><div ref={host} className="map" aria-label="Map: drag to pan, use plus and minus to zoom"/>
 <div className="map-toolbar"><div className="view-label"><span className="status-dot"/>MARITIME TRADE MAP</div><Button className="world-button" variant="outline" onClick={()=>map.current?.fitBounds([[-39,-100],[57,120]],{padding:[35,35]})}><Globe2 size={16}/>World view</Button></div>
 {!ready&&!error&&<div className="map-message" role="status">Loading the map…</div>}{error&&<div className="map-message error" role="alert">{error}<Button variant="outline" onClick={()=>window.location.reload()}>Retry</Button></div>}
 <div className="map-layers"><span><Layers size={15}/>LAYERS</span><label><input type="checkbox" checked={showRoutes} onChange={e=>setShowRoutes(e.target.checked)}/>Trade routes</label><label><input type="checkbox" checked={showPorts} onChange={e=>setShowPorts(e.target.checked)}/>Black Sea ports</label></div>
 <div className="legend"><span><i className="energy"/>Energy</span><span><i className="trade"/>Trade</span><span><i className="conflict"/>War context</span><span className="route-note"><Route size={14}/>Illustrative routes · no live status</span></div>
 </section></div><footer><span><Navigation size={13}/>Geographic context, not navigation guidance</span><a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Report a map issue <ArrowUpRight size={12}/></a><span>NATURAL EARTH / OPENSTREETMAP</span></footer>
 </main>;
}



