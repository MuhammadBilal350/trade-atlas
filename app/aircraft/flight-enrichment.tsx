'use client';
import {useEffect,useState} from 'react';
import type {Flight} from './data';
import type {AircraftDetails} from './details';
export default function FlightEnrichment({flight}:{flight:Flight}){
 const [details,setDetails]=useState<AircraftDetails|null>(null),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();setDetails(null);setError('');fetch('/api/aircraft/details?hex='+encodeURIComponent(flight.id)+'&callsign='+encodeURIComponent(flight.callsign),{signal:c.signal}).then(async r=>{if(!r.ok)throw new Error('Additional flight information is unavailable.');return r.json();}).then(d=>{if(!c.signal.aborted)setDetails(d as AircraftDetails);}).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[flight.id,flight.callsign]);
 if(error)return <p className="enrichment-note">{error}</p>;if(!details)return <p className="enrichment-note" role="status">Looking up aircraft and route…</p>;
 const minutes=details.estimatedMinutes;const duration=minutes===null?'Unavailable':`${Math.floor(minutes/60)}h ${minutes%60}m`;
 return <div className="flight-enrichment">{details.photo&&<figure><a href={details.photo.link} target="_blank" rel="noreferrer"><img src={details.photo.src} alt={`${flight.registration} aircraft photograph`} loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/></a><figcaption>Photo © {details.photo.photographer} · <a href={details.photo.link} target="_blank" rel="noreferrer">Planespotters.net</a></figcaption></figure>}
 <h3>{details.model||flight.type}</h3><p className="enrichment-note">{details.airline||details.owner||'Operator unavailable'}</p>
 <dl className="flight-extra"><div><dt>Flight number</dt><dd>{details.flightNumber||'Unavailable'}</dd></div><div><dt>Broadcast callsign</dt><dd>{flight.callsign}</dd></div></dl>
 <div className="flight-route"><span><small>FROM</small><strong>{details.origin?.code||'—'}</strong><span>{details.origin?.city||details.origin?.name||'Unknown origin'}</span></span><b>→</b><span><small>TO</small><strong>{details.destination?.code||'—'}</strong><span>{details.destination?.city||details.destination?.name||'Unknown destination'}</span></span></div>
 <p className="enrichment-note">Callsign-based route lookup. Not confirmed for today's flight.</p>
 <dl className="flight-extra"><div><dt>Route cruise estimate</dt><dd>{duration}</dd></div><div><dt>Scheduled / actual duration</dt><dd>Not provided</dd></div></dl>{minutes!==null&&<p className="enrichment-note">{Math.round(details.routeKm!).toLocaleString()} km direct distance at an assumed 450 kt. Excludes taxiing, routing, winds and delays; not an ETA.</p>}
 <div className="flight-unavailable"><strong>Passenger or cargo?</strong><p>{details.service}</p><strong>Luggage / cargo manifest</strong><p>Not public in these APIs. Baggage allowance depends on the airline, ticket and route.</p></div>
 {!!details.warnings.length&&<p className="enrichment-note">{details.warnings.join(' ')}</p>}
 <a className="enrichment-source" href="https://www.adsbdb.com/" target="_blank" rel="noreferrer">Aircraft and route lookup: adsbdb ↗</a>
 </div>;
}
