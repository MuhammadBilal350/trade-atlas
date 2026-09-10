import { normalizeFlights,regions } from '../../aircraft/data';
const cache=new Map<string,{expires:number;body:unknown}>();
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('region')||'gulf';const region=regions.find(r=>r.id===id);
 if(!region)return Response.json({error:'Unknown region'},{status:400});
 const prior=cache.get(id);if(prior&&prior.expires>Date.now())return Response.json(prior.body);
 try{
 const response=await fetch(`https://api.adsb.lol/v2/point/${region.lat}/${region.lon}/250`,{headers:{'User-Agent':'TradeAtlas/1.0 (+https://github.com/MuhammadBilal350/trade-atlas)'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)return Response.json({error:response.status===429?'The aircraft provider is rate limiting requests. Try again shortly.':'The aircraft provider is unavailable. Try again shortly.'},{status:response.status===429?429:502,headers:{'Retry-After':'60'}});
 const receivedAt=Date.now();const flights=normalizeFlights(await response.json(),receivedAt);
 const body={flights,receivedAt,region:region.id,source:'ADSB.lol',radiusNm:250};cache.set(id,{expires:receivedAt+30000,body});return Response.json(body);
 }catch{return Response.json({error:'Aircraft data could not be reached. Check your connection and try again.'},{status:503});}
}
