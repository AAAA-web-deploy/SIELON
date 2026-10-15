/* SIELON image-particle scene. Local three.js only; portraits stay photographic samples. */
import * as THREE from './vendor/three.min.js';
import {clamp,smooth,timeline,seedRandom,springStep} from './quantum-math.js';

const BODY=6.6;
const vertex=`
uniform float uWrist,uPair,uSplit,uCollapse,uTime,uPixelRatio,uSpread,uFocusY,uAssemble,uDepart;
uniform vec2 uImpact;
attribute vec3 aHuman,aSI,aWrist,aHumanColor,aSIColor,aWristColor,aOffset;
attribute float aSide,aSeed;
varying vec3 vColor; varying float vAlpha;
void main(){
 float pair=max(uPair,uSplit);
 vec3 portrait=mix(aHuman,aSI,step(0.,aSide)*pair);
 portrait.x+=aSide*pair*uSpread;
 portrait.z+=aSide*pair*.38;
 vec3 p=mix(portrait,aWrist,uWrist);
 vColor=mix(mix(aHumanColor,aSIColor,step(0.,aSide)*pair),aWristColor,uWrist);
 float transit=sin(uWrist*3.14159265)*(1.-uCollapse);
 p+=vec3(sin(aSeed*22.)*.16,cos(aSeed*17.)*.1,sin(aSeed*31.)*.18)*transit;
 float flight=0.;
 if(uAssemble>.5){
  float emerge=clamp(uPair,0.,1.);
  float depart=clamp(uDepart,0.,1.);
  float gate=fract(sin(aSeed*127.1)*43758.5453);
  float begin=gate*.5;
  float span=mix(.4,.58,gate);
  float local=clamp((emerge-begin)/span,0.,1.);
  flight=local*local*(3.-2.*local);
  vec3 origin=aHuman;
  origin.x*=.92;
  origin.y=mix(aHuman.y,uFocusY,.08);
  vec3 dest=aSI;
  dest.x+=uSpread;
  dest.z+=.28;
  float mid=sin(flight*3.14159265);
  vec3 bow=vec3(sin(aSeed*6.2),cos(aSeed*4.4),sin(aSeed*8.8));
  p=mix(origin,dest,flight);
  p+=bow*mid*(.85+gate*1.55);
  p+=vec3(cos(aSeed*3.1+uTime*.28),sin(aSeed*2.4-uTime*.22),0.)*mid*.22;
  vColor=mix(vec3(.98,.76,.36),aSIColor,smoothstep(.58,.94,flight));
  if(depart>.001){
   float scatter=depart*depart*(3.-2.*depart);
   vec3 home=aSide>0.?dest:aHuman;
   home.z=aSide>0.?.28:.16;
   vec3 spray=vec3(sin(aSeed*40.7)*1.2+aSide*.9,cos(aSeed*23.1)*.95+scatter*1.45,sin(aSeed*17.4)*.8);
   p=home+spray*scatter*3.4;
   p+=vec3(sin(aSeed*12.+uTime*3.1),cos(aSeed*9.-uTime*2.2),sin(aSeed*15.))*scatter*.55;
   vColor=mix(aSide>0.?aSIColor:aHumanColor,vec3(.99,.78,.34),smoothstep(.04,.3,scatter));
   vAlpha=smoothstep(.02,.14,scatter)*(1.-smoothstep(.62,1.,scatter));
  }
 }
 p+=aOffset;
 float turn=uCollapse*uCollapse*2.2;
 p.xy=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*(p.xy-vec2(0.,uFocusY));
 p.xy+=vec2(0.,uFocusY);
 p=mix(p,vec3(0.,uFocusY,.18),uCollapse);
 p.z+=sin(uTime*.65+aSeed*19.)*.012*(1.-uCollapse);
 float dist=distance(p.xy,uImpact);
 float edge=smoothstep(.55,3.4,dist);
 vAlpha=(1.-uCollapse*.96)*(1.-edge*uCollapse*.65);
 if(uAssemble>.5){
  if(uDepart>.001){float scatter=clamp(uDepart,0.,1.);scatter=scatter*scatter*(3.-2.*scatter);vAlpha=smoothstep(.02,.14,scatter)*(1.-smoothstep(.62,1.,scatter));}
  else vAlpha=smoothstep(.03,.16,flight)*(1.-smoothstep(.82,1.,flight));
 }
 vec4 mv=modelViewMatrix*vec4(p,1.);
 float sizeCut=1.-uCollapse*edge*.5;
 float sizeBoost=uAssemble>.5?(uDepart>.001?1.+sin(clamp(uDepart,0.,1.)*3.14159265)*.7:1.+sin(flight*3.14159265)*.28):1.;
 gl_PointSize=clamp(2.4*uPixelRatio*9./max(1.,-mv.z)*sizeCut*sizeBoost,1.,uDepart>.001?18.:9.);
 gl_Position=projectionMatrix*mv;
}`;
const fragment=`
varying vec3 vColor; varying float vAlpha;
void main(){float r=length(gl_PointCoord-.5);float a=(1.-smoothstep(.12,.5,r))*.82*vAlpha;if(a<.006)discard;gl_FragColor=vec4(vColor,a);
#include <colorspace_fragment>
}`;
const blurVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const blurFragment=`
uniform sampler2D tDiffuse;uniform vec2 uPointer;uniform float uAmount;uniform vec2 uTexel;varying vec2 vUv;
void main(){
 vec2 d=vUv-uPointer;float dist=length(d);
 float blur=smoothstep(.06,.48,dist)*uAmount;
 vec4 c=texture2D(tDiffuse,vUv)*(1.-blur*.35);
 vec2 px=uTexel*(1.+blur*5.5);
 c+=texture2D(tDiffuse,vUv+vec2(px.x,0.))*blur*.2;
 c+=texture2D(tDiffuse,vUv-vec2(px.x,0.))*blur*.2;
 c+=texture2D(tDiffuse,vUv+vec2(0.,px.y))*blur*.2;
 c+=texture2D(tDiffuse,vUv-vec2(0.,px.y))*blur*.2;
 c+=texture2D(tDiffuse,vUv+px)*blur*.12;
 gl_FragColor=vec4(c.rgb,c.a);
}`;

async function decodeImage(spec){
 const image=new Image();image.decoding='async';
 image.src=new URL(spec.url,document.baseURI).href;
 try{await image.decode();}catch(error){
  if(!spec.fallback)throw error;
  image.src=new URL(spec.fallback,document.baseURI).href;
  await image.decode();
 }
 return image;
}
function bottomIsHard(data,w,h){
 const y0=Math.floor(h*.985);
 let opaque=0,seen=0;
 const step=Math.max(1,Math.floor(w/80));
 for(let y=y0;y<h;y+=2)for(let x=0;x<w;x+=step){
  const a=data[(y*w+x)*4+3];
  if(a<12)continue;
  seen++;
  if(a>200)opaque++;
 }
 return seen>8&&opaque/seen>.5;
}
function fadeBottomRows(data,w,h){
 const start=h*.90,end=h*.995;
 for(let y=Math.floor(start);y<h;y++){
  const keep=1-smooth(start,end,y+.5);
  if(keep>.995)continue;
  const row=y*w*4;
  for(let x=0;x<w;x++)data[row+x*4+3]*=keep;
 }
}
function softenPlate(image){
 const plate=document.createElement('canvas');
 plate.width=image.naturalWidth||image.width;
 plate.height=image.naturalHeight||image.height;
 const ctx=plate.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(image,0,0);
 const plateData=ctx.getImageData(0,0,plate.width,plate.height);
 if(!bottomIsHard(plateData.data,plate.width,plate.height))return image;
 fadeBottomRows(plateData.data,plate.width,plate.height);
 ctx.putImageData(plateData,0,0);
 return plate;
}
function measure(data,w,h){
 let minX=w,minY=h,maxX=0,maxY=0;
 const rowL=new Int32Array(h),rowR=new Int32Array(h);
 rowL.fill(w);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(data[(y*w+x)*4+3]<48)continue;
  if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
  if(x<rowL[y])rowL[y]=x;if(x>rowR[y])rowR[y]=x;
 }
 const bh=Math.max(1,maxY-minY);
 let eye=minY+bh*.3,best=0;
 const top=minY+bh*.08,bot=minY+bh*.4;
 for(let y=Math.floor(top);y<=Math.floor(bot);y++){
  const span=rowR[y]-rowL[y];
  if(span>best){best=span;eye=y;}
 }
 return {minX,minY,maxX,maxY,eye,cx:(minX+maxX)*.5};
}
async function sourceCanvas(spec){
 const image=await decodeImage(spec);
 const [x,y,w,h]=spec.crop||[0,0,1,1];
 const canvas=document.createElement('canvas');
 canvas.width=280;
 canvas.height=Math.max(1,Math.round(280*(image.height*h)/(image.width*w)));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(image,x*image.width,y*image.height,w*image.width,h*image.height,0,0,canvas.width,canvas.height);
 const data=ctx.getImageData(0,0,canvas.width,canvas.height);
 if(spec.mask==='soft-ellipse'){
  for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++){
   const radius=Math.hypot((col/canvas.width-.5)/.49,(row/canvas.height-.46)/.56);
   data.data[(row*canvas.width+col)*4+3]*=1-smooth(.82,1,radius);
  }
 }
 if(spec.mask!=='soft-ellipse'&&bottomIsHard(data.data,canvas.width,canvas.height))fadeBottomRows(data.data,canvas.width,canvas.height);
 const box=measure(data.data,canvas.width,canvas.height);
 const bh=Math.max(1,box.maxY-box.minY);
 const scale=BODY/bh;
 const toLocal=(px,py)=>[(px-box.cx)*scale,(box.maxY-py)*scale];
 const eyeY=toLocal(box.cx,box.eye)[1];
 const samples=[];const color=new THREE.Color();
 for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++){
  const i=(row*canvas.width+col)*4,a=data.data[i+3];if(a<90)continue;
  const r=data.data[i],g=data.data[i+1],b=data.data[i+2];
  color.setRGB(r/255,g/255,b/255,THREE.SRGBColorSpace);
  const brightness=(r+g+b)/765;
  const local=toLocal(col+.5,row+.5);
  samples.push([local[0],local[1],.04+brightness*.16,color.r,color.g,color.b]);
 }
 if(!samples.length)throw new Error('Portrait texture has no visible samples.');
 const center=toLocal(canvas.width*.5,canvas.height*.5);
 const plate=spec.mask==='soft-ellipse'?image:softenPlate(image);
 return {image:plate,samples,eyeY,halfW:(box.maxX-box.minX)*.5*scale,top:(box.maxY-box.minY)*scale,planeW:canvas.width*scale,planeH:canvas.height*scale,originX:center[0],originY:center[1]};
}

function pickSample(source,random,face){
 let choice=source.samples[Math.floor(random()*source.samples.length)];
 if(!face)return choice;
 const eye=source.eyeY;
 for(let n=0;n<5;n++){
  const candidate=source.samples[Math.floor(random()*source.samples.length)];
  if(candidate[1]>eye-.8&&candidate[1]<eye+.7)return candidate;
  choice=candidate;
 }
 return choice;
}

export async function createSielonField(host,{sources,pointCount=18000,onAvailability=()=>{},assemble=false}={}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance',premultipliedAlpha:true});}catch(error){onAvailability(false);throw error;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=true;
 const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');canvas.setAttribute('role','presentation');canvas.style.width='100%';canvas.style.height='100%';canvas.style.display='block';canvas.style.pointerEvents='none';
 const scene=new THREE.Scene();const group=new THREE.Group();scene.add(group);
 const camera=new THREE.PerspectiveCamera(35,1,.1,50);camera.position.z=10;
 const count=clamp(Math.floor(pointCount),6000,20000),random=seedRandom();
 let human,si,wrist;
 try{[human,si,wrist]=await Promise.all([sourceCanvas(sources.human),sourceCanvas(sources.si),sourceCanvas(sources.wrist)]);}catch(error){renderer.dispose();onAvailability(false);throw error;}
 const eyeTarget=(human.eyeY+si.eyeY)*.5;
 const shift={human:eyeTarget-human.eyeY,si:eyeTarget-si.eyeY};
 for(const [source,key] of [[human,'human'],[si,'si']]){
  const dy=shift[key];
  for(const sample of source.samples)sample[1]+=dy;
  source.eyeY+=dy;source.top+=dy;source.originY+=dy;
 }
 const wristScale=(BODY*.36)/Math.max(wrist.top,.001);
 const wristLift=BODY*.42;
 for(const sample of wrist.samples){sample[0]*=wristScale;sample[1]=sample[1]*wristScale+wristLift;sample[2]*=.6;}
 const spread=(human.halfW+si.halfW)*.46;
 const apart=(human.halfW+si.halfW)*1.22;
 const focusY=eyeTarget*.62;
 const positions=[new Float32Array(count*3),new Float32Array(count*3),new Float32Array(count*3)];
 const colors=[new Float32Array(count*3),new Float32Array(count*3),new Float32Array(count*3)];
 const sides=new Float32Array(count),seeds=new Float32Array(count),offsets=new Float32Array(count*3),velocities=new Float32Array(count*3);
 const banks=[[human,true],[si,true],[wrist,false]];
 banks.forEach(([source,face],k)=>{
  for(let i=0;i<count;i++){
   const sample=pickSample(source,random,face);
   positions[k].set(sample.slice(0,3),i*3);colors[k].set(sample.slice(3),i*3);
  }
 });
 for(let i=0;i<count;i++){sides[i]=i%2?1:-1;seeds[i]=random();}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions[0],3));
 const attributes={aHuman:positions[0],aSI:positions[1],aWrist:positions[2],aHumanColor:colors[0],aSIColor:colors[1],aWristColor:colors[2]};
 Object.entries(attributes).forEach(([name,array])=>geometry.setAttribute(name,new THREE.BufferAttribute(array,3)));
 const displacement=new THREE.BufferAttribute(offsets,3).setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('aOffset',displacement);
 geometry.setAttribute('aSide',new THREE.BufferAttribute(sides,1));geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
 const uniforms={uWrist:{value:0},uPair:{value:0},uSplit:{value:0},uCollapse:{value:0},uTime:{value:0},uPixelRatio:{value:renderer.getPixelRatio()},uSpread:{value:spread},uFocusY:{value:focusY},uAssemble:{value:assemble?1:0},uDepart:{value:0},uImpact:{value:new THREE.Vector2()}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false});
 const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;group.add(cloud);
 const portraits=[human,si].map((source,k)=>{
  const texture=new THREE.Texture();texture.image=source.image;texture.colorSpace=THREE.SRGBColorSpace;texture.premultiplyAlpha=true;texture.needsUpdate=true;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(source.planeW,source.planeH),new THREE.MeshBasicMaterial({map:texture,transparent:true,premultipliedAlpha:true,opacity:0,depthWrite:false}));
  mesh.position.set(source.originX,source.originY,.2);mesh.renderOrder=2;group.add(mesh);return {mesh,texture,source,k};
 });
 const core=new THREE.Mesh(new THREE.SphereGeometry(.08,12,8),new THREE.MeshBasicMaterial({color:'#ffc36c',transparent:true,opacity:0,depthWrite:false}));core.position.set(0,focusY,.2);group.add(core);
 const dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(140*3);
 for(let i=0;i<dustPos.length;i+=3){dustPos[i]=(random()-.5)*16;dustPos[i+1]=(random()-.35)*9;dustPos[i+2]=-2.2-random()*5;}
 dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
 const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#e6c7a2',size:.018,transparent:true,opacity:.07,depthWrite:false}));scene.add(dust);
 const metalCount=640;
 const metalGeo=new THREE.BufferGeometry();
 const metalPos=new Float32Array(metalCount*3),metalHome=new Float32Array(metalCount*3),metalVel=new Float32Array(metalCount*3);
 for(let i=0;i<metalCount;i++){
  const angle=random()*Math.PI*2;
  const radius=Math.pow(random(),.55)*human.halfW*1.05;
  const ix=i*3;
  metalHome[ix]=Math.cos(angle)*radius*.62;
  metalHome[ix+1]=.35+random()*human.top*.86;
  metalHome[ix+2]=(random()-.32)*.85;
  metalPos[ix]=metalHome[ix];metalPos[ix+1]=metalHome[ix+1];metalPos[ix+2]=metalHome[ix+2];
 }
 metalGeo.setAttribute('position',new THREE.BufferAttribute(metalPos,3));
 const speck=document.createElement('canvas');speck.width=32;speck.height=32;
 const speckCtx=speck.getContext('2d');
 const speckGlow=speckCtx.createRadialGradient(16,16,0,16,16,16);
 speckGlow.addColorStop(0,'rgba(255,255,255,1)');
 speckGlow.addColorStop(.28,'rgba(214,228,236,.8)');
 speckGlow.addColorStop(1,'rgba(214,228,236,0)');
 speckCtx.fillStyle=speckGlow;speckCtx.fillRect(0,0,32,32);
 const speckMap=new THREE.CanvasTexture(speck);
 const metal=new THREE.Points(metalGeo,new THREE.PointsMaterial({map:speckMap,color:'#d5e4ee',size:.04,transparent:true,opacity:0,depthWrite:false}));
 metal.frustumCulled=false;metal.renderOrder=4;group.add(metal);
 const focusScene=new THREE.Scene();
 const focusCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const focusMat=new THREE.ShaderMaterial({
  uniforms:{tDiffuse:{value:null},uPointer:{value:new THREE.Vector2(.5,.5)},uAmount:{value:0},uTexel:{value:new THREE.Vector2(1/800,1/600)}},
  vertexShader:blurVertex,fragmentShader:blurFragment,transparent:true,depthTest:false,depthWrite:false,toneMapped:false
 });
 const focusQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),focusMat);focusScene.add(focusQuad);
 let focusTarget=null,focusEnabled=true,drawCount=count;
 host.append(canvas);
 let progress=0,departAmt=0,held=0,holdTarget=0,pointer={x:0,y:0},pointerLast={x:0,y:0},pointerEnergy=0,metalGlow=0,paused=false,reduced=false,visible=true,lost=false,destroyed=false,raf=0,last=0,time=0,slow=0,viewW=10;
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0),impact=new THREE.Vector3(),ndc=new THREE.Vector2();
 function fit(emerge=0){
  const z=Math.max(camera.position.z,.1);
  const visibleH=2*Math.tan(THREE.MathUtils.degToRad(17.5))*z;
  const visibleW=visibleH*Math.max(camera.aspect,.2);
  viewW=visibleW;
  const narrow=visibleW<visibleH*1.38;
  const gutter=narrow?0.2:0.32;
  const regionW=visibleW*(1-gutter-.04);
  const top=Math.max(human.top,si.top);
  const span=human.halfW+si.halfW+spread*2;
  if(assemble){
   const pairWidth=human.halfW+apart+si.halfW;
   const solo=(visibleH*(narrow?0.82:0.88))/Math.max(human.top,.001);
   const room=visibleW*(narrow?0.62:0.54);
   const pair=Math.min((visibleH*(narrow?0.7:0.78))/top,room/Math.max(pairWidth,.001));
   const scale=solo+(pair-solo)*emerge;
   group.scale.setScalar(scale);
   group.position.y=-visibleH*.5+visibleH*.03;
   const pairCenter=visibleW*(narrow?0.12:0.18)*emerge;
   group.position.x=pairCenter-scale*apart*.5*emerge;
   group.position.z=0;
   return;
  }
  const scale=Math.min((visibleH*(narrow?0.68:0.76))/top,regionW*.98/span);
  group.scale.setScalar(scale);
  group.position.y=-visibleH*.5+visibleH*.025;
  group.position.x=-visibleW*.5+visibleW*gutter+regionW*.5;
  group.position.z=0;
 }
 function resize(){
  const rect=host.getBoundingClientRect();
  const width=Math.max(1,Math.round(rect.width));
  const height=Math.max(1,Math.round(rect.height));
  renderer.setSize(width,height,false);
  canvas.style.width='100%';canvas.style.height='100%';
  camera.aspect=width/height;camera.updateProjectionMatrix();fit();
  if(focusTarget){focusTarget.dispose();focusTarget=null;}
  focusMat.uniforms.uTexel.value.set(1/Math.max(2,canvas.width),1/Math.max(2,canvas.height));
  draw(0);
 }
 function ensureTarget(){
  const w=Math.max(2,canvas.width),h=Math.max(2,canvas.height);
  if(!focusTarget||focusTarget.width!==w||focusTarget.height!==h){
   focusTarget?.dispose();
   focusTarget=new THREE.WebGLRenderTarget(w,h,{depthBuffer:true,stencilBuffer:false});
   focusTarget.texture.colorSpace=THREE.SRGBColorSpace;
   focusMat.uniforms.tDiffuse.value=focusTarget.texture;
   focusMat.uniforms.uTexel.value.set(1/w,1/h);
  }
 }
 function wristMixFor(state,collapse){
  const glimpse=smooth(.12,.42,collapse)*(1-smooth(.78,.96,collapse));
  return state.wrist*glimpse;
 }
 function draw(dt){
  if(destroyed||lost)return;
  const state=timeline(progress);const blend=dt>0?1-Math.exp(-dt/.12):1;held+=(holdTarget-held)*blend;
  const emerge=assemble?smooth(.04,.98,progress):0;
  const depart=assemble?clamp(departAmt):0;
  const split=assemble?0:(progress<.24?held:0);const collapse=assemble?0:Math.max(state.collapse,progress>=.24&&progress<.58?held:0);const formed=assemble?emerge:Math.max(state.pair,split);
  const wristMix=assemble?0:wristMixFor(state,collapse);
  const glide=assemble||reduced?0:smooth(.08,.4,progress)*(1-smooth(.58,.94,progress));
  const targetZ=10-glide*1.05;
  camera.position.z=dt>0?camera.position.z+(targetZ-camera.position.z)*blend:targetZ;
  fit(emerge);
  uniforms.uAssemble.value=assemble?1:0;uniforms.uDepart.value=depart;uniforms.uSpread.value=assemble?apart:spread;uniforms.uWrist.value=wristMix;uniforms.uPair.value=assemble?emerge:state.pair;uniforms.uSplit.value=split;uniforms.uCollapse.value=collapse;uniforms.uTime.value=time;
  ndc.set(pointer.x,-pointer.y);ray.setFromCamera(ndc,camera);
  if(ray.ray.intersectPlane(plane,impact))group.worldToLocal(impact);
  uniforms.uImpact.value.set(impact.x,impact.y);
  if(!reduced&&dt>0){
   for(let i=0;i<drawCount;i++){
    const index=i*3,branch=sides[i],source=branch>0?positions[1]:positions[0];
    const px=(positions[0][index]*(1-formed)+source[index]*formed)+branch*formed*spread;
    const py=positions[0][index+1]*(1-formed)+source[index+1]*formed;
    const x=px*(1-wristMix)+positions[2][index]*wristMix+offsets[index]-impact.x;
    const y=py*(1-wristMix)+positions[2][index+1]*wristMix+offsets[index+1]-impact.y;
    const distance=x*x+y*y;let fx=0,fy=0,fz=0;
    if(distance<1.1&&pointerEnergy>.01){const force=(1-distance/1.1)*pointerEnergy*18/Math.sqrt(distance+.02);fx=(x-y*.16)*force;fy=(y+x*.16)*force;fz=Math.sin(seeds[i]*21)*force*.12;}
    springStep(offsets,velocities,index,fx,dt);springStep(offsets,velocities,index+1,fy,dt);springStep(offsets,velocities,index+2,fz,dt);
   }
   displacement.needsUpdate=true;
   metalGlow=Math.max(metalGlow*Math.exp(-dt*1.15),Math.min(1,pointerEnergy*2.2));
   pointerEnergy*=Math.exp(-dt*7);
   const pull=1-Math.exp(-dt*2.4);
   for(let i=0;i<metalCount;i++){
    const ix=i*3;
    const dx=metalPos[ix]-impact.x,dy=metalPos[ix+1]-impact.y,dist=dx*dx+dy*dy;
    if(metalGlow>.04&&dist<4.2){
     const push=(1-dist/4.2)*metalGlow*dt*9,inv=1/Math.sqrt(dist+.05);
     metalVel[ix]+=dx*inv*push;metalVel[ix+1]+=dy*inv*push;metalVel[ix+2]+=(seeds[i]-.5)*push*.6;
    }
    metalVel[ix]+=(metalHome[ix]+Math.sin(time*1.4+i)*.04-metalPos[ix])*pull;
    metalVel[ix+1]+=(metalHome[ix+1]+Math.cos(time*1.1+i)*.05-metalPos[ix+1])*pull;
    metalVel[ix+2]+=(metalHome[ix+2]-metalPos[ix+2])*pull;
    const damp=Math.exp(-dt*1.6);
    metalVel[ix]*=damp;metalVel[ix+1]*=damp;metalVel[ix+2]*=damp;
    metalPos[ix]+=metalVel[ix];metalPos[ix+1]+=metalVel[ix+1];metalPos[ix+2]+=metalVel[ix+2];
   }
   metalGeo.attributes.position.needsUpdate=true;
   metal.material.opacity=.012+metalGlow*.55;
   metal.material.size=.022+metalGlow*.028;
   const yaw=clamp(pointer.x*.055,-.056,.056),pitch=clamp(-pointer.y*.028,-.028,.028);
   const turn=1-Math.exp(-dt*6);
   group.rotation.y+=(yaw-group.rotation.y)*turn;group.rotation.x+=(pitch-group.rotation.x)*turn;
  }
  portraits.forEach(({mesh,k,source})=>{
   if(assemble){
    mesh.position.x=source.originX+(k?apart:0);
    mesh.position.y=source.originY;
    mesh.position.z=k?0.28:0.2;
    const bodyFade=1-smooth(0,.42,depart);
    mesh.material.opacity=(k?smooth(.68,.96,emerge):1)*bodyFade;
    return;
   }
   mesh.position.x=source.originX+(k?1:-1)*formed*spread;
   mesh.position.y=source.originY;
   mesh.position.z=.2+(k?0.28:-0.16)*formed;
   const photo=(1-wristMix)*(1-collapse);
   const presence=k?formed*.92:(.86-state.cloud*.12);
   mesh.material.opacity=Math.max(0,photo*presence*(1-pointerEnergy*.18));
  });
  core.material.opacity=collapse*.95;core.scale.setScalar(.55+collapse*1.35);
  const formationDust=reduced?0.08:0.08+Math.sin(emerge*Math.PI)*.22;
  const scatterDust=Math.sin(Math.min(depart,1)*Math.PI)*.42;
  dust.material.opacity=assemble?(depart>.001?scatterDust:formationDust):(reduced?0.04:0.07)*(1-collapse);
  if(depart>.001)metal.material.opacity=0;
  if(reduced)metal.material.opacity=0;
  const useFocus=focusEnabled&&collapse>.18&&!reduced;
  if(useFocus){
   ensureTarget();
   focusMat.uniforms.uAmount.value=collapse;
   focusMat.uniforms.uPointer.value.set(pointer.x*.5+.5,.5-pointer.y*.5);
   core.visible=false;
   renderer.autoClear=false;
   renderer.setRenderTarget(focusTarget);renderer.clear();renderer.render(scene,camera);
   renderer.setRenderTarget(null);renderer.clear();renderer.render(focusScene,focusCam);
   core.visible=true;renderer.clearDepth();renderer.render(core,camera);
   renderer.autoClear=true;
  }else{
   core.visible=true;renderer.autoClear=true;renderer.setRenderTarget(null);renderer.render(scene,camera);
  }
 }
 function degrade(){
  const ratio=renderer.getPixelRatio();
  if(ratio>1){renderer.setPixelRatio(Math.max(1,Math.round((ratio-.25)*100)/100));uniforms.uPixelRatio.value=renderer.getPixelRatio();resize();return;}
  if(focusEnabled){focusEnabled=false;return;}
  if(drawCount>8000){drawCount=Math.max(8000,Math.floor(drawCount*.72));geometry.setDrawRange(0,drawCount);}
 }
 function tick(now){
  raf=0;
  if(destroyed||paused||reduced||!visible||lost||document.hidden)return;
  const raw=last?(now-last)/1000:1/60;
  last=now;
  if(raw>.05&&raw<.45)slow++;else if(raw<=.05)slow=Math.max(0,slow-1);
  if(slow>24){slow=0;degrade();}
  const dt=Math.min(Math.max(raw,0),1/30);
  time+=dt;draw(dt);raf=requestAnimationFrame(tick);
 }
 function start(){if(!raf&&!destroyed&&!paused&&!reduced&&visible&&!lost&&!document.hidden){last=0;slow=0;raf=requestAnimationFrame(tick);}}
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{stop();holdTarget=0;held=0;pointerEnergy=0;slow=0;}});intersection.observe(host);
 function visibility(){if(document.hidden){stop();holdTarget=0;held=0;slow=0;}else start();}
 function contextLost(event){event.preventDefault();lost=true;stop();onAvailability(false);host.classList.remove('field-ready');}
 function contextRestored(){lost=false;resize();onAvailability(true);host.classList.add('field-ready');start();}
 document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
 resize();host.classList.add('field-ready');onAvailability(true);start();
 const api={
  setProgress(p){progress=clamp(p);if(paused||reduced)draw(0);else start();},
  setDepart(value){departAmt=clamp(value);if(paused||reduced)draw(0);else start();},
  move(x,y){const next={x:clamp(x,-1,1),y:clamp(y,-1,1)};pointerEnergy=clamp(pointerEnergy+Math.hypot(next.x-pointerLast.x,next.y-pointerLast.y)*3);pointer=next;pointerLast=next;start();},
  leave(){pointer={x:0,y:0};pointerLast=pointer;pointerEnergy=0;holdTarget=0;},
  setSplit(value){holdTarget=value?1:0;if(reduced||paused){held=holdTarget;draw(0);}else start();},
  setPaused(value){paused=!!value;if(paused){stop();held=0;holdTarget=0;slow=0;draw(0);}else start();},
  setReducedMotion(value){reduced=!!value;if(reduced){stop();offsets.fill(0);velocities.fill(0);displacement.needsUpdate=true;group.rotation.set(0,0,0);held=0;holdTarget=0;camera.position.z=10;slow=0;draw(0);}else start();},
  destroy(){destroyed=true;stop();resizeObserver.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);geometry.dispose();material.dispose();portraits.forEach(({mesh,texture})=>{mesh.geometry.dispose();mesh.material.dispose();texture.dispose();});core.geometry.dispose();core.material.dispose();dust.geometry.dispose();dust.material.dispose();metal.geometry.dispose();metal.material.map.dispose();metal.material.dispose();focusQuad.geometry.dispose();focusMat.dispose();focusTarget?.dispose();renderer.dispose();canvas.remove();host.classList.remove('field-ready');}
 };
 return api;
}
