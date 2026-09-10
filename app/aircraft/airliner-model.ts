import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Representative twin-engine airliner. Proportions informed by top-view A320 photographs.
// Not an exact model, livery or verified seating/cargo configuration of the tracked aircraft.
export function airlinerGeometry(){
 const parts:T.BufferGeometry[]=[];
 const body=new T.SphereGeometry(1,24,16);body.scale(.13,1,.13);parts.push(body);
 const wing=new T.Shape();wing.moveTo(.08,.2);wing.lineTo(.94,-.25);wing.lineTo(.94,-.39);wing.lineTo(.09,-.12);wing.closePath();
 const wings=new T.ExtrudeGeometry(wing,{depth:.035,bevelEnabled:false});wings.translate(0,0,-.045);parts.push(wings);const left=wings.clone();left.rotateY(Math.PI);parts.push(left);
 const tail=new T.Shape();tail.moveTo(.04,-.6);tail.lineTo(.38,-.8);tail.lineTo(.38,-.94);tail.lineTo(.04,-.81);tail.closePath();const rightTail=new T.ExtrudeGeometry(tail,{depth:.025,bevelEnabled:false});parts.push(rightTail);const leftTail=rightTail.clone();leftTail.rotateY(Math.PI);parts.push(leftTail);
 const fin=new T.Shape();fin.moveTo(-.57,0);fin.lineTo(-.86,.34);fin.lineTo(-.98,.34);fin.lineTo(-.89,0);fin.closePath();const vertical=new T.ExtrudeGeometry(fin,{depth:.035,bevelEnabled:false});vertical.applyMatrix4(new T.Matrix4().makeBasis(new T.Vector3(0,1,0),new T.Vector3(0,0,1),new T.Vector3(1,0,0)));vertical.translate(-.017,0,.07);parts.push(vertical);
 for(const x of [-.36,.36]){const engine=new T.CylinderGeometry(.077,.059,.29,16);engine.translate(x,-.04,-.11);parts.push(engine);}
 const normalized=parts.map(p=>{const g=p.index?p.toNonIndexed():p.clone();g.clearGroups();return g;});const geometry=mergeGeometries(normalized);parts.forEach(p=>p.dispose());normalized.forEach(p=>p.dispose());return geometry;
}

