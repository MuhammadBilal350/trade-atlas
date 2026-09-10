import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {Flight} from './data';
import {airlinerGeometry} from './airliner-model';
export function position(lat:number,lon:number,r=100){const a=lat*Math.PI/180,b=lon*Math.PI/180;return new T.Vector3(r*Math.cos(a)*Math.cos(b),r*Math.sin(a),-r*Math.cos(a)*Math.sin(b));}
export async function createGlobe(host:HTMLDivElement,onHover:(f:Flight|null)=>void,signal:AbortSignal,onPick?:(f:Flight)=>void){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,3));renderer.setClearColor('#08121f');host.appendChild(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.1,1200);camera.position.copy(position(25.25,55.36,145));
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=105;controls.maxDistance=350;controls.rotateSpeed=.5;
 scene.add(new T.AmbientLight('#d3edff',2));const light=new T.DirectionalLight('#f5fcff',2);light.position.set(100,150,200);scene.add(light);
 const globe=new T.Mesh(new T.SphereGeometry(100,256,128),new T.MeshStandardMaterial({color:'#142a3b',roughness:1}));scene.add(globe);
 const atmosphere=new T.Mesh(new T.SphereGeometry(100.4,64,32),new T.MeshBasicMaterial({color:'#3891b9',transparent:true,opacity:.045,side:T.BackSide}));scene.add(atmosphere);
 const gridMaterial=new T.LineBasicMaterial({color:'#234157',transparent:true,opacity:.35});
 for(let lat=-60;lat<=60;lat+=30){const pts=[];for(let lon=-180;lon<=180;lon+=2)pts.push(position(lat,lon,100.05));scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),gridMaterial));}
 for(let lon=-180;lon<180;lon+=30){const pts=[];for(let lat=-90;lat<=90;lat+=2)pts.push(position(lat,lon,100.05));scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),gridMaterial));}
 const geometry=airlinerGeometry();
 const planes=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color:'#edf5fa',emissive:'#254d62',emissiveIntensity:.15,metalness:.3,roughness:.4}),1000);planes.count=0;planes.frustumCulled=false;scene.add(planes);
 const ringMaterial=new T.LineBasicMaterial({color:'#56cfcf',transparent:true,opacity:.5});let ring:T.Line|undefined;
 let flights:Flight[]=[],selected:string|null=null,disposed=false,frame=0,pointerDown=false;
 const matrix=new T.Matrix4(),dummy=new T.Object3D();
 const update=(data:Flight[])=>{flights=data.slice(0,1000);planes.count=flights.length;flights.forEach((f,i)=>{
 const phi=f.lat*Math.PI/180,lambda=f.lon*Math.PI/180;
 const east=new T.Vector3(-Math.sin(lambda),0,-Math.cos(lambda)),north=new T.Vector3(-Math.sin(phi)*Math.cos(lambda),Math.cos(phi),Math.sin(phi)*Math.sin(lambda)),up=position(f.lat,f.lon,1);
 matrix.makeBasis(east,north,up);dummy.quaternion.setFromRotationMatrix(matrix);dummy.rotateZ(-(f.heading??0)*Math.PI/180);dummy.position.copy(up.multiplyScalar(100.15+(f.altitude??0)*.0003048/6371*100*25));dummy.scale.setScalar(f.id===selected?.toString()? .48:.32);dummy.updateMatrix();planes.setMatrixAt(i,dummy.matrix);planes.setColorAt(i,new T.Color(f.id===selected?'#ffc373':'#83f1dc'));
 });planes.instanceMatrix.needsUpdate=true;if(planes.instanceColor)planes.instanceColor.needsUpdate=true;planes.computeBoundingSphere();};
 const focus=(lat:number,lon:number)=>{controls.enableRotate=true;controls.enablePan=false;controls.mouseButtons.LEFT=T.MOUSE.ROTATE;camera.position.copy(position(lat,lon,132));camera.up.copy(new T.Vector3(0,1,0));controls.minDistance=105;controls.maxDistance=350;controls.target.set(0,0,0);controls.update();if(ring){scene.remove(ring);ring.geometry.dispose();}
 const pts:T.Vector3[]=[];const phi=lat*Math.PI/180,lam=lon*Math.PI/180,d=250*1.852/6371;for(let i=0;i<=128;i++){const b=i/128*Math.PI*2;const a=Math.asin(Math.sin(phi)*Math.cos(d)+Math.cos(phi)*Math.sin(d)*Math.cos(b));const l=lam+Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(phi),Math.cos(d)-Math.sin(phi)*Math.sin(a));pts.push(position(a*180/Math.PI,l*180/Math.PI,100.1));}ring=new T.Line(new T.BufferGeometry().setFromPoints(pts),ringMaterial);scene.add(ring);};
 const ray=new T.Raycaster(),mouse=new T.Vector2();let lastHover:string|null=null;
 const move=(event:PointerEvent)=>{if(pointerDown)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects([globe,planes],false)[0];const f=hit?.object===planes&&hit.instanceId!==undefined?flights[hit.instanceId]:null;renderer.domElement.style.cursor=f?'pointer':'grab';if((f?.id??null)!==lastHover){lastHover=f?.id??null;onHover(f??null);}};
 let startX=0,startY=0;const down=(e:PointerEvent)=>{pointerDown=true;startX=e.clientX;startY=e.clientY;};const up=(e:PointerEvent)=>{const wasDown=pointerDown;pointerDown=false;if(wasDown&&Math.hypot(e.clientX-startX,e.clientY-startY)<5){move(e);const f=flights.find(f=>f.id===lastHover);if(f)onPick?.(f);}};const leave=()=>{lastHover=null;onHover(null);};
 renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointerleave',leave);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const animate=()=>{if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden)return;controls.update();renderer.render(scene,camera);};animate();
 const cleanup=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();window.removeEventListener('pointerup',up);scene.traverse(o=>{const mesh=o as T.Mesh;mesh.geometry?.dispose();const material=mesh.material;if(Array.isArray(material))material.forEach(m=>m.dispose());else material?.dispose();});(globe.material as T.MeshStandardMaterial).map?.dispose();renderer.dispose();renderer.domElement.remove();};
 signal.addEventListener('abort',cleanup,{once:true});
 try{const response=await fetch('/world-land-hires.geojson',{signal});if(!response.ok)throw new Error('Coastline unavailable');const data=await response.json() as {features:{geometry:{type:string;coordinates:number[][][]|number[][][][]}}[]};if(disposed)return;
 const canvas=document.createElement('canvas');const w=Math.min(renderer.capabilities.maxTextureSize,host.clientWidth>700?8192:4096),h=w/2;canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#0b1b2c';ctx.fillRect(0,0,w,h);ctx.fillStyle='#234257';ctx.strokeStyle='#3c6577';ctx.lineWidth=.7;
 for(const feature of data.features){const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates as number[][][]]:feature.geometry.coordinates as number[][][][];for(const polygon of polygons){ctx.beginPath();for(const loop of polygon){loop.forEach(([lon,lat],i)=>{const x=(lon+180)/360*w,y=(90-lat)/180*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();}ctx.fill('evenodd');ctx.stroke();}}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());globe.material.map=texture;globe.material.color.set('#ffffff');globe.material.needsUpdate=true;
 }catch(error){if(!disposed){cleanup();throw error;}}
 const godEye=(lat:number,lon:number)=>{controls.enableRotate=false;controls.enablePan=true;controls.screenSpacePanning=true;controls.mouseButtons.LEFT=T.MOUSE.PAN;const up=position(lat,lon,1),phi=lat*Math.PI/180,lam=lon*Math.PI/180;controls.target.copy(position(lat,lon,100));camera.position.copy(up.multiplyScalar(118));camera.up.set(-Math.sin(phi)*Math.cos(lam),Math.cos(phi),Math.sin(phi)*Math.sin(lam));controls.minDistance=8;controls.maxDistance=100;controls.update();};
 return {update,focus,godEye,select:(id:string|null)=>{selected=id;update(flights);},zoom:(amount:number)=>{camera.position.sub(controls.target).multiplyScalar(amount).add(controls.target);controls.update();},reset:()=>focus(25.25,55.36),dispose:cleanup};
}



