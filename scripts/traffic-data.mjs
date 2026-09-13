export const areas=[['hormuz',26.56,56.25],['black-sea',44,31.5],['suez',30.5,32.35],['bab',12.58,43.33],['malacca',2.7,101],['turkish',41.15,29.06],['panama',9.1,-79.7],['cape',-34.7,18.5]].map(([id,lat,lon])=>({id,lat,lon}));
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const clean=v=>typeof v==='string'?v.replace(/@/g,'').trim().slice(0,100):'';
export function insideArea(lat,lon,area){if(!finite(lat)||!finite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return false;const rad=Math.PI/180;const a=Math.sin((lat-area.lat)*rad/2)**2+Math.cos(lat*rad)*Math.cos(area.lat*rad)*Math.sin((lon-area.lon)*rad/2)**2;return 3440.065*2*Math.asin(Math.sqrt(Math.min(1,a)))<=100;}
export function mergeVessel(previous,payload,now=Date.now()){
 const meta=payload?.MetaData;const mmsi=String(meta?.MMSI??'');if(!/^\d{9}$/.test(mmsi))return null;
 const type=payload.MessageType,r=payload.Message?.[type];if(!r||r.Valid===false)return previous??null;
 const v={mmsi,name:clean(meta.ShipName)||mmsi,kind:'Unknown',destination:null,lat:null,lon:null,speed:null,heading:null,positionAt:null,staticAt:null,...previous};
 if(type==='ShipStaticData'||type==='StaticDataReport'){
 const data=r.ReportB??r;const shipType=data.Type??data.ShipType;v.name=clean(r.Name??r.ReportA?.Name)||v.name;
 v.kind=shipType>=80&&shipType<=89?'Tanker':shipType>=70&&shipType<=79?'Cargo vessel':shipType>=60&&shipType<=69?'Passenger vessel':shipType===30?'Fishing vessel':shipType===52?'Tug':shipType===36?'Sailing vessel':shipType===37?'Pleasure craft':v.kind;
 v.destination=clean(r.Destination)||v.destination;v.staticAt=now;
 }else if(['PositionReport','StandardClassBPositionReport','ExtendedClassBPositionReport'].includes(type)){
 const lat=r.Latitude,lon=r.Longitude;
 if(finite(lat)&&finite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180){v.lat=lat;v.lon=lon;v.positionAt=now;v.speed=finite(r.Sog)&&r.Sog>=0&&r.Sog<102.3?r.Sog:null;v.heading=finite(r.Cog)&&r.Cog>=0&&r.Cog<360?r.Cog:null;}
 }return v;
}
export function snapshot(vessels,area,now,connected,aircraft){return {time:now,aircraft,vessels:connected?vessels.filter(v=>v.positionAt!==null&&now-v.positionAt<=600000&&insideArea(v.lat,v.lon,area)).length:null};}
