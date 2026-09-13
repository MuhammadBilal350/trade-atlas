import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeVessel,insideArea,snapshot} from '../scripts/traffic-data.mjs';
test('AIS static data does not invent a position or cargo manifest',()=>{
 const v=mergeVessel(undefined,{MessageType:'ShipStaticData',MetaData:{MMSI:123456789},Message:{ShipStaticData:{Type:80,Destination:' DUBAI @@',Name:' TEST '}}},1000);
 assert.equal(v.kind,'Tanker');assert.equal(v.destination,'DUBAI');assert.equal(v.lat,null);assert.equal(v.positionAt,null);
});
test('AIS rejects invalid positions and sentinel speed, preserves voyage data',()=>{
 const initial=mergeVessel(undefined,{MessageType:'ShipStaticData',MetaData:{MMSI:123456789},Message:{ShipStaticData:{Type:70,Destination:'SUEZ'}}},1000);
 const v=mergeVessel(initial,{MessageType:'PositionReport',MetaData:{MMSI:123456789},Message:{PositionReport:{Latitude:26.56,Longitude:56.25,Sog:102.3,Cog:360,Valid:true}}},2000);
 assert.equal(v.speed,null);assert.equal(v.heading,null);assert.equal(v.destination,'SUEZ');assert.equal(v.positionAt,2000);
 assert.equal(mergeVessel(v,{MessageType:'PositionReport',MetaData:{MMSI:123456789},Message:{PositionReport:{Latitude:91,Longitude:181}}},3000).positionAt,2000);
});
test('same radius, freshness, and unavailable counts',()=>{
 assert.equal(insideArea(26.56,56.25,{lat:26.56,lon:56.25}),true);
 assert.equal(insideArea(0,0,{lat:26.56,lon:56.25}),false);
 const v={mmsi:'123456789',lat:26.56,lon:56.25,positionAt:1000};
 assert.equal(snapshot([v],{lat:26.56,lon:56.25},1000000,true,4).vessels,0);
 assert.equal(snapshot([v],{lat:26.56,lon:56.25},2000,false,null).vessels,null);
 assert.equal(snapshot([v],{lat:26.56,lon:56.25},2000,true,4).vessels,1);
});
