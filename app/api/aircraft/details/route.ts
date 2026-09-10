import {airport,greatCircleKm,type AircraftDetails} from '../../../aircraft/details';
const headers={'User-Agent':'TradeAtlas/1.0 (+https://github.com/MuhammadBilal350/trade-atlas)'};
async function get(url:string){try{const r=await fetch(url,{headers,signal:AbortSignal.timeout(8000)});return r.ok?await r.json():null;}catch{return null;}}
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const hex=params.get('hex')||'',callsign=(params.get('callsign')||'').trim();
 if(!/^[a-f0-9]{6}$/i.test(hex)||! /^[a-z0-9-]{0,12}$/i.test(callsign))return Response.json({error:'Invalid aircraft identifier'},{status:400});
 const [identity,route,photos]=await Promise.all([get('https://api.adsbdb.com/v0/aircraft/'+hex),callsign?get('https://api.adsbdb.com/v0/callsign/'+encodeURIComponent(callsign)):null,get('https://api.planespotters.net/pub/photos/hex/'+hex)]) as [any,any,any];
 const ac=identity?.response?.aircraft,r=route?.response?.flightroute,p=photos?.photos?.[0];const origin=airport(r?.origin),destination=airport(r?.destination);const routeKm=origin&&destination?greatCircleKm(origin,destination):null;
 const validPhoto=p&&typeof p.thumbnail_large?.src==='string'&&p.thumbnail_large.src.startsWith('https://t.plnspttrs.net/')&&typeof p.link==='string'&&p.link.startsWith('https://www.planespotters.net/photo/');
 const model=ac?[ac.manufacturer,ac.type].filter(x=>typeof x==='string').join(' '):null;
 const service=model&&/freighter|cargo|\b\d{3}[ -]?F\b/i.test(model)?'Freighter type in aircraft registry; actual load unknown':'Passenger / cargo service not confirmed by free data';
 const body:AircraftDetails={model,owner:typeof ac?.registered_owner==='string'?ac.registered_owner:null,flightNumber:typeof r?.callsign_iata==='string'?r.callsign_iata:null,airline:typeof r?.airline?.name==='string'?r.airline.name:null,origin,destination,routeKm,estimatedMinutes:routeKm===null?null:Math.round(routeKm/(450*1.852)*60),service,photo:validPhoto?{src:p.thumbnail_large.src,link:p.link,photographer:String(p.photographer||'Planespotters contributor')}:null,warnings:[]};
 if(!identity)body.warnings.push('Aircraft registry lookup unavailable.');if(!origin||!destination)body.warnings.push('No callsign route available.');if(!photos)body.warnings.push('Photo service unavailable.');
 return Response.json(body,{headers:{'Cache-Control':'private, max-age=300'}});
}
