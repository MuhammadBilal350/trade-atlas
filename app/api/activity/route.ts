import {locations} from '../../trade-data';
export async function GET(request:Request){
 const region=new URL(request.url).searchParams.get('region');if(!locations.some(a=>a.id===region))return Response.json({error:'Unknown region'},{status:400});
 try{const r=await fetch('http://127.0.0.1:4319/?region='+encodeURIComponent(region!),{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();return Response.json(await r.json(),{headers:{'Cache-Control':'no-store'}});}
 catch{return Response.json({error:'Activity collector is offline. Start the project with npm run dev.'},{status:503});}
}
