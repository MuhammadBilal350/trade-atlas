import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFlights} from '../app/aircraft/data.ts';
const row={hex:'abc123',lat:25,lon:55,alt_baro:30000,gs:450,track:90,seen_pos:5,flight:' TEST123 '};
test('normalizes observation age, units, and callsign',()=>{const f=normalizeFlights({ac:[row]},100000)[0];assert.equal(f.callsign,'TEST123');assert.equal(f.altitude,30000);assert.equal(f.observedAt,95000);assert.equal(f.heading,90);});
test('excludes ground, stale, invalid and duplicate positions',()=>{const rows=[row,row,{...row,hex:'abc124',alt_baro:'ground'},{...row,hex:'abc125',seen_pos:61},{...row,hex:'abc126',lat:91},{...row,hex:'abc127',lon:null}];assert.equal(normalizeFlights({ac:rows}).length,1);});
test('missing altitude remains unknown and malformed response is rejected',()=>{assert.equal(normalizeFlights({ac:[{...row,alt_baro:undefined} ]})[0].altitude,null);assert.throws(()=>normalizeFlights({error:'bad'}));});

import {airport,greatCircleKm} from '../app/aircraft/details.ts';
import {airlinerGeometry} from '../app/aircraft/airliner-model.ts';
test('distance estimates use valid great-circle geography',()=>{const a={lat:0,lon:0,code:'A',name:'A',city:'A'};assert.equal(greatCircleKm(a,a),0);assert.ok(Math.abs(greatCircleKm(a,{...a,lon:90})-10007.5)<1);assert.equal(airport({latitude:91,longitude:1}),null);});
test('representative model has finite three-dimensional geometry',()=>{const g=airlinerGeometry();assert.ok(g);g.computeBoundingBox();const b=g.boundingBox;assert.ok(b.max.x-b.min.x>1);assert.ok(b.max.y-b.min.y>1.5);assert.ok(b.max.z-b.min.z>.3);for(const n of g.attributes.position.array)assert.ok(Number.isFinite(n));g.dispose();});
