/* SIELON image-particle scene. Local three.js only; portraits stay photographic samples. */
import * as THREE from './vendor/three.min.js';
import {clamp,smooth,timeline,seedRandom,springStep} from './quantum-math.js';

const vertex=`
uniform float uWrist,uPair,uSplit,uCollapse,uTime,uPixelRatio;
uniform vec2 uImpact;
attribute vec3 aHuman,aSI,aWrist,aHumanColor,aSIColor,aWristColor,aOffset;
attribute float aSide,aSeed;
varying vec3 vColor; varying float vAlpha;
void main(){
 float pair=max(uPair,uSplit);
 vec3 portrait=mix(aHuman,aSI,step(0.,aSide)*pair);
 portrait.xy*=1.-pair*.5;
 portrait.x+=aSide*pair*.82-pair*.35;
 portrait.z+=aSide*pair*.55;
 vec3 p=mix(portrait,aWrist,uWrist);
 vColor=mix(mix(aHumanColor,aSIColor,step(0.,aSide)*pair),aWristColor,uWrist);
 float transit=sin(uWrist*3.14159265);
 p+=vec3(sin(aSeed*22.+uTime)*.26,cos(aSeed*17.+uTime)*.18,sin(aSeed*31.)*.48)*transit;
 p+=aOffset;
 float turn=uCollapse*uCollapse*2.2;
 p.xy=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*p.xy;
 p=mix(p,vec3(0.,0.,.18),uCollapse);
 p.z+=sin(uTime*.65+aSeed*19.)*.012*(1.-uCollapse);
 float dist=distance(p.xy,uImpact);
 float edge=smoothstep(.28,2.2,dist);
 vAlpha=(1.-uCollapse*.96)*(1.-edge*uCollapse*.65);
 vec4 mv=modelViewMatrix*vec4(p,1.);
 float sizeCut=1.-uCollapse*edge*.5;
 gl_PointSize=clamp(3.0*uPixelRatio*9./max(1.,-mv.z)*sizeCut,1.,7.);
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

function ellipse(rx,ry,y,z,color,opacity){
 const positions=new Float32Array(65*3);
 for(let i=0;i<=64;i++){
  const a=i/64*Math.PI*2;
  positions[i*3]=Math.cos(a)*rx;
  positions[i*3+1]=y+Math.sin(a)*ry;
  positions[i*3+2]=z+Math.sin(a)*.28;
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));
 line.frustumCulled=false;
 return line;
}

async function sourceCanvas(spec){
 const image=new Image();image.decoding='async';image.src=new URL(spec.url,document.baseURI).href;
 try{await image.decode();}catch(error){if(!spec.fallback)throw error;image.src=new URL(spec.fallback,document.baseURI).href;await image.decode();}
 const [x,y,w,h]=spec.crop||[0,0,1,1];
 const canvas=document.createElement('canvas');canvas.width=280;canvas.height=Math.max(1,Math.round(280*image.height*h/(image.width*w)));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(image,x*image.width,y*image.height,w*image.width,h*image.height,0,0,canvas.width,canvas.height);
 const data=ctx.getImageData(0,0,canvas.width,canvas.height);
 if(spec.mask==='soft-ellipse'){
  for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++){
   const radius=Math.hypot((col/canvas.width-.5)/.49,(row/canvas.height-.46)/.56);
   data.data[(row*canvas.width+col)*4+3]*=1-smooth(.82,1,radius);
  }
  ctx.putImageData(data,0,0);
 }
 const samples=[];const color=new THREE.Color();const height=4.35;const width=height*canvas.width/canvas.height;
 for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++){
  const i=(row*canvas.width+col)*4,a=data.data[i+3];if(a<90)continue;
  const r=data.data[i],g=data.data[i+1],b=data.data[i+2];
  color.setRGB(r/255,g/255,b/255,THREE.SRGBColorSpace);
  const brightness=(r+g+b)/765;
  samples.push([(col/canvas.width-.5)*width,(.5-row/canvas.height)*height,.04+brightness*.2,color.r,color.g,color.b]);
 }
 if(!samples.length)throw new Error('Portrait texture has no visible samples.');
 return {canvas,samples,width,height};
}

function pickSample(source,random,face){
 let choice=source.samples[Math.floor(random()*source.samples.length)];
 if(!face)return choice;
 for(let n=0;n<5;n++){
  const candidate=source.samples[Math.floor(random()*source.samples.length)];
  if(candidate[1]>0.15)return candidate;
  choice=candidate;
 }
 return choice;
}

export async function createSielonField(host,{sources,pointCount=18000,onAvailability=()=>{}}={}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'});}catch(error){onAvailability(false);throw error;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=true;
 const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');canvas.setAttribute('role','presentation');canvas.style.width='100%';canvas.style.height='100%';canvas.style.display='block';canvas.style.pointerEvents='none';
 const scene=new THREE.Scene();const group=new THREE.Group();scene.add(group);
 const camera=new THREE.PerspectiveCamera(35,1,.1,50);camera.position.z=10;
 const count=clamp(Math.floor(pointCount),6000,20000),random=seedRandom();
 let human,si,wrist;
 try{[human,si,wrist]=await Promise.all([sourceCanvas(sources.human),sourceCanvas(sources.si),sourceCanvas(sources.wrist)]);}catch(error){renderer.dispose();onAvailability(false);throw error;}
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
 const uniforms={uWrist:{value:0},uPair:{value:0},uSplit:{value:0},uCollapse:{value:0},uTime:{value:0},uPixelRatio:{value:renderer.getPixelRatio()},uImpact:{value:new THREE.Vector2()}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false});
 const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;group.add(cloud);
 const portraits=[human,si].map((source,k)=>{
  const texture=new THREE.CanvasTexture(source.canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(source.width,source.height),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false}));
  mesh.position.z=.24;mesh.renderOrder=2;group.add(mesh);return {mesh,texture,source,k};
 });
 const core=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),new THREE.MeshBasicMaterial({color:'#ffc36c',transparent:true,opacity:0,depthWrite:false}));core.position.z=.2;group.add(core);
 const ribbons=[
  ellipse(4.4,.55,-2.35,-.7,'#e7a35a',.28),
  ellipse(3.5,.38,-2.05,-1.5,'#6ec8e6',.18),
  ellipse(5,.62,-2.7,.05,'#f0c27a',.14)
 ];
 ribbons.forEach(line=>group.add(line));
 const strandCount=42,strandPos=new Float32Array(strandCount*3);
 const strandGeo=new THREE.BufferGeometry();strandGeo.setAttribute('position',new THREE.BufferAttribute(strandPos,3));
 const strand=new THREE.Line(strandGeo,new THREE.LineBasicMaterial({color:'#f2c48a',transparent:true,opacity:0,depthWrite:false}));
 strand.frustumCulled=false;group.add(strand);
 const dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(900*3);
 for(let i=0;i<dustPos.length;i+=3){dustPos[i]=(random()-.5)*13;dustPos[i+1]=(random()-.5)*8;dustPos[i+2]=-1.4-random()*6.5;}
 dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
 const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#7ec4e4',size:.014,transparent:true,opacity:.16,depthWrite:false}));scene.add(dust);
 const focusScene=new THREE.Scene();
 const focusCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const focusMat=new THREE.ShaderMaterial({
  uniforms:{tDiffuse:{value:null},uPointer:{value:new THREE.Vector2(.5,.5)},uAmount:{value:0},uTexel:{value:new THREE.Vector2(1/800,1/600)}},
  vertexShader:blurVertex,fragmentShader:blurFragment,transparent:true,depthTest:false,depthWrite:false,toneMapped:false
 });
 const focusQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),focusMat);focusScene.add(focusQuad);
 let focusTarget=null,focusEnabled=true;
 host.append(canvas);
 let progress=0,held=0,holdTarget=0,pointer={x:0,y:0},pointerLast={x:0,y:0},pointerEnergy=0,paused=false,reduced=false,visible=true,lost=false,destroyed=false,raf=0,last=0,time=0,slow=0;
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0),impact=new THREE.Vector3(),ndc=new THREE.Vector2();
 function fit(){
  const z=Math.max(camera.position.z,.1);
  const visibleH=2*Math.tan(THREE.MathUtils.degToRad(17.5))*z;
  const visibleW=visibleH*Math.max(camera.aspect,.2);
  group.scale.setScalar(Math.min(1,(visibleW*.9)/6.2,(visibleH*.88)/4.6));
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
 function draw(dt){
  if(destroyed||lost)return;
  const state=timeline(progress);const blend=dt>0?1-Math.exp(-dt/.12):1;held+=(holdTarget-held)*blend;
  const split=progress<.24?held:0;const collapse=Math.max(state.collapse,progress>=.24&&progress<.72?held:0);const formed=Math.max(state.pair,split);
  const glide=reduced?0:smooth(.08,.4,progress)*(1-smooth(.58,.94,progress));
  const targetZ=10-glide*1.05;
  camera.position.z=dt>0?camera.position.z+(targetZ-camera.position.z)*blend:targetZ;
  fit();
  uniforms.uWrist.value=state.wrist;uniforms.uPair.value=state.pair;uniforms.uSplit.value=split;uniforms.uCollapse.value=collapse;uniforms.uTime.value=time;
  ndc.set(pointer.x,-pointer.y);ray.setFromCamera(ndc,camera);
  if(ray.ray.intersectPlane(plane,impact))group.worldToLocal(impact);
  uniforms.uImpact.value.set(impact.x,impact.y);
  if(!reduced&&dt>0){
   for(let i=0;i<count;i++){
    const index=i*3,branch=sides[i],source=branch>0?positions[1]:positions[0];
    const shrink=1-formed*.5;
    const px=(positions[0][index]*(1-formed)+source[index]*formed)*shrink+branch*formed*.82-formed*.35;
    const py=(positions[0][index+1]*(1-formed)+source[index+1]*formed)*shrink;
    const x=px*(1-state.wrist)+positions[2][index]*state.wrist+offsets[index]-impact.x;
    const y=py*(1-state.wrist)+positions[2][index+1]*state.wrist+offsets[index+1]-impact.y;
    const distance=x*x+y*y;let fx=0,fy=0,fz=0;
    if(distance<.55&&pointerEnergy>.01){const force=(1-distance/.55)*pointerEnergy*15/Math.sqrt(distance+.015);fx=(x-y*.16)*force;fy=(y+x*.16)*force;fz=Math.sin(seeds[i]*21)*force*.12;}
    springStep(offsets,velocities,index,fx,dt);springStep(offsets,velocities,index+1,fy,dt);springStep(offsets,velocities,index+2,fz,dt);
   }
   displacement.needsUpdate=true;pointerEnergy*=Math.exp(-dt*7);
   const yaw=clamp(pointer.x*.055,-.056,.056),pitch=clamp(-pointer.y*.028,-.028,.028);
   const turn=1-Math.exp(-dt*6);
   group.rotation.y+=(yaw-group.rotation.y)*turn;group.rotation.x+=(pitch-group.rotation.x)*turn;
   if(dt>.045)slow++;else slow=Math.max(0,slow-1);
   if(slow>28){
    const ratio=renderer.getPixelRatio();
    if(ratio>1){renderer.setPixelRatio(Math.max(1,Math.round((ratio-.25)*100)/100));uniforms.uPixelRatio.value=renderer.getPixelRatio();slow=0;resize();return;}
    if(focusEnabled){focusEnabled=false;slow=0;}
   }
  }
  portraits.forEach(({mesh,k})=>{
   mesh.position.x=(k?1:-1)*formed*.82-formed*.35;
   mesh.position.z=.24+(k?0.35:-0.22)*formed;
   mesh.scale.setScalar(1-formed*.5);
   const photo=(1-state.wrist)*(1-collapse);
   const presence=k?formed*.9:(.82-state.cloud*.18);
   mesh.material.opacity=Math.max(0,photo*presence*(1-pointerEnergy*.22));
  });
  core.material.opacity=collapse*.95;core.scale.setScalar(.65+collapse*1.5);
  const lineFade=(1-collapse)*(1-state.wrist*.65);
  ribbons.forEach((line,index)=>{line.material.opacity=([.28,.18,.14][index])*lineFade;});
  strand.material.opacity=formed*(1-collapse)*.5;
  if(formed>.02){
   for(let i=0;i<strandCount;i++){
    const t=i/(strandCount-1);
    strandPos[i*3]=(-.9+1.75*t)*formed-formed*.35;
    strandPos[i*3+1]=-1.55-Math.sin(t*Math.PI)*.55;
    strandPos[i*3+2]=(-.4+.95*t)*formed;
   }
   strandGeo.attributes.position.needsUpdate=true;
  }
  dust.material.opacity=(reduced?0.1:0.16)*(1-collapse);
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
 function tick(now){raf=0;if(destroyed||paused||reduced||!visible||lost||document.hidden)return;const dt=last?Math.min((now-last)/1000,1/30):1/60;last=now;time+=dt;draw(dt);raf=requestAnimationFrame(tick);}
 function start(){if(!raf&&!destroyed&&!paused&&!reduced&&visible&&!lost&&!document.hidden){last=0;raf=requestAnimationFrame(tick);}}
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{stop();holdTarget=0;held=0;pointerEnergy=0;}});intersection.observe(host);
 function visibility(){if(document.hidden){stop();holdTarget=0;held=0;}else start();}
 function contextLost(event){event.preventDefault();lost=true;stop();onAvailability(false);host.classList.remove('field-ready');}
 function contextRestored(){lost=false;resize();onAvailability(true);host.classList.add('field-ready');start();}
 document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
 resize();host.classList.add('field-ready');onAvailability(true);start();
 const api={
  setProgress(p){progress=clamp(p);if(paused||reduced)draw(0);else start();},
  move(x,y){const next={x:clamp(x,-1,1),y:clamp(y,-1,1)};pointerEnergy=clamp(pointerEnergy+Math.hypot(next.x-pointerLast.x,next.y-pointerLast.y)*3);pointer=next;pointerLast=next;start();},
  leave(){pointer={x:0,y:0};pointerLast=pointer;pointerEnergy=0;holdTarget=0;},
  setSplit(value){holdTarget=value?1:0;if(reduced||paused){held=holdTarget;draw(0);}else start();},
  setPaused(value){paused=!!value;if(paused){stop();held=0;holdTarget=0;draw(0);}else start();},
  setReducedMotion(value){reduced=!!value;if(reduced){stop();offsets.fill(0);velocities.fill(0);displacement.needsUpdate=true;group.rotation.set(0,0,0);held=0;holdTarget=0;camera.position.z=10;draw(0);}else start();},
  destroy(){destroyed=true;stop();resizeObserver.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);geometry.dispose();material.dispose();portraits.forEach(({mesh,texture})=>{mesh.geometry.dispose();mesh.material.dispose();texture.dispose();});core.geometry.dispose();core.material.dispose();ribbons.forEach(line=>{line.geometry.dispose();line.material.dispose();});strandGeo.dispose();strand.material.dispose();dust.geometry.dispose();dust.material.dispose();focusQuad.geometry.dispose();focusMat.dispose();focusTarget?.dispose();renderer.dispose();canvas.remove();host.classList.remove('field-ready');}
 };
 return api;
}
