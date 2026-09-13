import {createServer} from 'node:http';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import WebSocket from 'ws';
import {areas,insideArea,mergeVessel,snapshot} from './traffic-data.mjs';
const port=4319,key=process.env.AISSTREAM_API_KEY;
const vessels=new Map(),active=new Map(),airCounts=new Map();let history={},connected=false,status=key?'Connecting vessel feed':'Vessel feed needs a free AISStream key',socket,retry=1000,stopping=false,sampling=false;
await mkdir('.traffic-data',{recursive:true});
try{const data=JSON.parse(await readFile('.traffic-data/history.json','utf8'));for(const area of areas)history[area.id]=Array.isArray(data[area.id])?data[area.id].filter(p=>Number.isFinite(p.time)&&p.time>Date.now()-86400000&&(p.aircraft===null||Number.isInteger(p.aircraft)&&p.aircraft>=0)&&(p.vessels===null||Number.isInteger(p.vessels)&&p.vessels>=0)):[];}catch{}
function connect(){if(!key||stopping)return;socket=new WebSocket('wss://stream.aisstream.io/v0/stream',{perMessageDeflate:true,handshakeTimeout:15000});
 socket.on('open',()=>socket.send(JSON.stringify({APIKey:key,BoundingBoxes:areas.map(a=>[[a.lat-1.7,a.lon-1.7/Math.cos(a.lat*Math.PI/180)],[a.lat+1.7,a.lon+1.7/Math.cos(a.lat*Math.PI/180)]]),FilterMessageTypes:['PositionReport','StandardClassBPositionReport','ExtendedClassBPositionReport','ShipStaticData','StaticDataReport']})));
 socket.on('message',bytes=>{try{const p=JSON.parse(bytes.toString());if(p.MessageType==='SubscriptionConfirmation'){connected=true;retry=1000;status='Receiving AIS reports';return;}if(p.error||p.Error){status='AIS subscription rejected; check the key and account limits';connected=false;socket.close();return;}const v=mergeVessel(vessels.get(String(p.MetaData?.MMSI)),p);if(v)vessels.set(v.mmsi,v);}catch{}});
 socket.on('error',()=>{status='Vessel feed unavailable; retrying';});socket.on('close',()=>{connected=false;if(!stopping){status='Vessel feed disconnected; retrying';setTimeout(connect,retry+Math.random()*1000);retry=Math.min(retry*2,60000);}});
}
async function sample(){if(sampling)return;sampling=true;try{const now=Date.now();for(const [id,last] of active){if(now-last>180000){active.delete(id);continue;}const area=areas.find(a=>a.id===id);let count=null;
 try{const r=await fetch(`https://api.adsb.lol/v2/point/${area.lat}/${area.lon}/100`,{headers:{'User-Agent':'TradeAtlas/1.0 (+https://github.com/MuhammadBilal350/trade-atlas)'},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data.ac))throw Error();const ids=new Set();for(const f of data.ac)if(typeof f.hex==='string'&&/^~?[a-f0-9]{6}$/i.test(f.hex)&&f.alt_baro!=='ground'&&Number.isFinite(f.seen_pos)&&f.seen_pos>=0&&f.seen_pos<=60&&insideArea(f.lat,f.lon,area))ids.add(f.hex);count=ids.size;}catch{}
 const time=Date.now();airCounts.set(id,{count,time});const point=snapshot([...vessels.values()],area,time,connected,count);history[id]=[...(history[id]??[]).filter(p=>time-p.time<86400000),point].slice(-1440);
 }
 for(const [id,v] of vessels)if(now-(v.positionAt??v.staticAt??0)>86400000)vessels.delete(id);
 await writeFile('.traffic-data/history.tmp',JSON.stringify(history));await rename('.traffic-data/history.tmp','.traffic-data/history.json');
 }catch{console.error('Activity history could not be saved.');}finally{sampling=false;}}
const server=createServer((req,res)=>{if(req.method!=='GET'){res.writeHead(405).end();return;}const url=new URL(req.url,'http://localhost');const area=areas.find(a=>a.id===url.searchParams.get('region'));if(!area){res.writeHead(400).end();return;}
 const first=!active.has(area.id);active.set(area.id,Date.now());if(first)void sample();const now=Date.now();const observed=[...vessels.values()].filter(v=>v.positionAt!==null&&now-v.positionAt<=600000&&insideArea(v.lat,v.lon,area));const air=airCounts.get(area.id);
 res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({region:area.id,time:now,connected,status,vessels:observed,aircraft:air&&now-air.time<90000?air.count:null,history:(history[area.id]??[]).filter(p=>now-p.time<86400000),radiusNm:100}));
});
server.on('error',e=>{console.error('Traffic collector could not start:',e.code);process.exit(1);});server.listen(port,'127.0.0.1',()=>console.log('Traffic collector listening locally on port '+port));connect();const timer=setInterval(sample,60000);
for(const event of ['SIGINT','SIGTERM'])process.on(event,()=>{stopping=true;clearInterval(timer);socket?.close();server.close();setTimeout(()=>process.exit(),300).unref();});

