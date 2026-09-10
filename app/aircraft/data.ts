export const regions=[{id:'gulf',name:'Persian Gulf',lat:25.25,lon:55.36},{id:'black-sea',name:'Black Sea',lat:43,lon:30},{id:'europe',name:'Western Europe',lat:50,lon:5},{id:'singapore',name:'Singapore',lat:1.35,lon:103.8},{id:'us-east',name:'US East Coast',lat:40.7,lon:-74}] as const;
export type Flight={id:string;callsign:string;registration:string;type:string;lat:number;lon:number;altitude:number|null;speed:number|null;heading:number|null;observedAt:number};
const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export function normalizeFlights(payload:unknown,receivedAt=Date.now()):Flight[]{
 if(!payload||typeof payload!=='object'||!('ac' in payload)||!Array.isArray(payload.ac))throw new Error('Unexpected aircraft response');
 const seen=new Set<string>();const result:Flight[]=[];
 for(const row of payload.ac){if(!row||typeof row!=='object')continue;const r=row as Record<string,unknown>;
 if(typeof r.hex!=='string'||!/^~?[a-f0-9]{6}$/i.test(r.hex)||seen.has(r.hex)||!number(r.lat)||!number(r.lon)||Math.abs(r.lat)>90||Math.abs(r.lon)>180||r.alt_baro==='ground'||!number(r.seen_pos)||r.seen_pos<0||r.seen_pos>60)continue;
 const altitude=number(r.alt_geom)?r.alt_geom:number(r.alt_baro)?r.alt_baro:null;
 if(altitude!==null&&(altitude<0||altitude>70000))continue;
 seen.add(r.hex);result.push({id:r.hex,callsign:typeof r.flight==='string'?r.flight.trim()||r.hex:r.hex,registration:typeof r.r==='string'?r.r:'Unknown',type:typeof r.t==='string'?r.t:'Unknown',lat:r.lat,lon:r.lon,altitude,speed:number(r.gs)&&r.gs>=0?r.gs:null,heading:number(r.track)?((r.track%360)+360)%360:null,observedAt:receivedAt-r.seen_pos*1000});
 }return result;
}
