'use client';
import {useEffect,useRef,useState} from 'react';
import {Globe2,Plane,Anchor,RefreshCw,Plus,Minus,LocateFixed,Pause,Play} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {regions,type Flight} from './data';
import type {createAircraftMap} from './flat-map';
import FlightEnrichment from './flight-enrichment';
export default function Aircraft(){
 const host=useRef<HTMLDivElement>(null),globe=useRef<Awaited<ReturnType<typeof createAircraftMap>>>(undefined);
 const [region,setRegion]=useState('gulf'),[flights,setFlights]=useState<Flight[]>([]),[hover,setHover]=useState<Flight|null>(null),[picked,setPicked]=useState<string|null>(null),[error,setError]=useState(''),[sceneError,setSceneError]=useState(''),[ready,setReady]=useState(false),[received,setReceived]=useState<number|null>(null),[loading,setLoading]=useState(true),[paused,setPaused]=useState(false),[tick,setTick]=useState(0),[now,setNow]=useState(Date.now());

 const area=regions.find(r=>r.id===region)!;
 useEffect(()=>{const controller=new AbortController();import('./flat-map').then(({createAircraftMap})=>{if(host.current&&!controller.signal.aborted)return createAircraftMap(host.current,setHover,controller.signal,f=>setPicked(f.id));}).then(g=>{if(!g||controller.signal.aborted)return;globe.current=g;setReady(true);}).catch(()=>{if(!controller.signal.aborted)setSceneError('Map could not load. Reload to retry. Aircraft details remain available below.');});return()=>{controller.abort();globe.current=undefined;};},[]);
 useEffect(()=>{globe.current?.focus(area.lat,area.lon);setPicked(null);setHover(null);},[area,ready]);
 useEffect(()=>{const f=flights.find(f=>f.id===picked);if(f)globe.current?.focus(f.lat,f.lon,8);},[picked,area,ready]);
 useEffect(()=>{globe.current?.update(flights);},[flights,ready]);
 useEffect(()=>{globe.current?.select(picked);},[picked]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{setFlights([]);setReceived(null);setPicked(null);setHover(null);},[region]);
 useEffect(()=>{let stopped=false,timer:ReturnType<typeof setTimeout>;const controller=new AbortController();setError('');setLoading(!paused);
 const fetchFlights=async()=>{if(stopped||paused)return;if(document.hidden){timer=setTimeout(fetchFlights,30000);return;}setLoading(true);try{const r=await fetch('/api/aircraft?region='+region,{signal:controller.signal});const body=await r.json() as {flights:Flight[];receivedAt:number;error?:string};if(!r.ok)throw new Error(body.error||'Aircraft feed unavailable');if(!stopped){setFlights(body.flights);setReceived(body.receivedAt);setError('');}}catch(e){if(!stopped)setError(e instanceof Error?e.message:'Aircraft feed unavailable');}finally{if(!stopped){setLoading(false);timer=setTimeout(fetchFlights,30000);}}};void fetchFlights();return()=>{stopped=true;clearTimeout(timer);controller.abort();};},[region,paused,tick]);
 const chosen=flights.find(f=>f.id===(picked??hover?.id));const stale=!!error||(received!==null&&now-received>75000);
 const number=(n:number|null,unit:string)=>n===null?'Unknown':Math.round(n).toLocaleString()+' '+unit;
 return <main className="air-page"><header className="topbar"><a className="brand" href="/"><Globe2 size={27}/><span>TRADE<span className="brand-light">ATLAS</span></span></a><nav className="mode-tabs" aria-label="Map mode"><a href="/"><Anchor size={16}/>Maritime</a><a href="/aircraft" aria-current="page"><Plane size={16}/>Aircraft</a></nav><span className="air-provider">ADSB.lol / FREE FEED</span></header>
 <div className="air-workspace"><aside className="air-sidebar"><p className="eyebrow">ABOVE THE TRADE ROUTES</p><h1>Airspace<br/>in motion.</h1><p className="air-intro">Jump between regions and inspect reported aircraft positions.</p><label className="region-label" htmlFor="air-region">REGION · 250 NM RADIUS</label><select id="air-region" value={region} onChange={e=>setRegion(e.target.value)}>{regions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>
 <div className="air-count"><strong>{flights.length}</strong><span>aircraft with recent positions</span></div><div className="air-feed-state" role="status"><i className={stale?'stale':''}/>{paused?'Updates paused':loading?'Updating feed…':received?`Updated ${Math.max(0,Math.floor((now-received)/1000))}s ago`:'Waiting for feed'}{stale&&<b>Data may be stale</b>}</div>
 <div className="air-actions"><Button variant="outline" onClick={()=>setPaused(p=>!p)}>{paused?<Play/>:<Pause/>}{paused?'Resume':'Pause'}</Button><Button variant="outline" disabled={loading||paused} onClick={()=>setTick(t=>t+1)}><RefreshCw/>Refresh</Button></div>
 {error&&<p className="air-error" role="alert">{error}</p>}
 <div className="air-list-title">AIRCRAFT <span>select to inspect</span></div><div className="air-list">{!loading&&!flights.length&&!error&&<p>No recent airborne positions were returned for this region. Coverage varies; try another region.</p>}{flights.map(f=><button key={f.id} className={picked===f.id?'selected':''} onClick={()=>{setPicked(p=>p===f.id?null:f.id);}}><Plane size={15}/><span><strong>{f.callsign}</strong><small>{f.type} · {f.registration}</small></span><em>{number(f.altitude,'ft')}</em></button>)}</div><p className="air-footnote">Coverage is incomplete. No flight is invented when the feed is empty. Aircraft symbols are enlarged for visibility.</p></aside>
 <section className="air-stage" aria-label="2D aircraft activity map"><div className="air-canvas" ref={host}/><div className="air-top-label"><span className="status-dot"/> {area.name.toUpperCase()} <span>LIVE POSITIONS</span></div>{!ready&&!sceneError&&<p className="air-loading">Preparing the map…</p>}{sceneError&&<p className="air-loading air-error">{sceneError}</p>}
 <div className="air-controls"><Button className="god-eye-button" disabled={!flights.length} onClick={()=>{const index=flights.findIndex(f=>f.id===picked);setPicked(flights[(index+1)%flights.length].id);}}>Next aircraft</Button><Button aria-label="Zoom in" onClick={()=>globe.current?.zoom(.85)}><Plus/></Button><Button aria-label="Zoom out" onClick={()=>globe.current?.zoom(1.15)}><Minus/></Button><Button aria-label="Reset region view" onClick={()=>{setPicked(null);globe.current?.focus(area.lat,area.lon);}}><LocateFixed/></Button></div>
 {chosen&&<article className="air-detail"><div className="air-detail-top"><span>REPORTED POSITION</span>{picked&&<button aria-label="Close aircraft details" onClick={()=>setPicked(null)}>×</button>}</div><h2><Plane size={20}/>{chosen.callsign}</h2><p>{chosen.registration} · {chosen.type}</p><dl><div><dt>Altitude</dt><dd>{number(chosen.altitude,'ft')}</dd></div><div><dt>Ground speed</dt><dd>{number(chosen.speed,'kt')}</dd></div><div><dt>Track</dt><dd>{number(chosen.heading,'°')}</dd></div><div><dt>Position age</dt><dd>{Math.max(0,Math.floor((now-chosen.observedAt)/1000))}s</dd></div></dl><small>{chosen.lat.toFixed(3)}°, {chosen.lon.toFixed(3)}° · ICAO {chosen.id}</small>{picked?<FlightEnrichment flight={chosen}/>:<p className="enrichment-note">Click this aircraft or select it in the list for its photo and flight details.</p>}</article>}
 <div className="air-bottom"><span>Drag to pan · scroll to zoom · click to inspect</span><span>2D activity map · true reported positions</span></div><a className="air-attribution" href="https://www.adsb.lol/docs/open-data/api/" target="_blank" rel="noreferrer">Aircraft: ADSB.lol</a><span className="air-earth-credit">Map: Natural Earth · high resolution</span></section></div></main>;
}





