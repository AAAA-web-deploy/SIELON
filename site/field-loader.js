/* Desktop-only wiring for [data-field-stage]. Mobile never imports Three.js. */
const capable=matchMedia('(min-width:768px) and (hover:hover) and (pointer:fine)');
const reduce=matchMedia('(prefers-reduced-motion:reduce)');
const records=new Map();let epoch=0;
const eligible=()=>capable.matches&&!reduce.matches;
function release(record){record.engine?.setSplit(false);record.engine?.leave();}
function holdMode(amount,wrist){
 if(wrist)return amount<.58?'gather':'off';
 if(amount<.24)return 'reveal';
 if(amount<.58)return 'gather';
 return 'off';
}
function phaseName(amount){
 if(amount<.22)return 'One face';
 if(amount<.64)return 'Look closer';
 return 'Two together';
}
function syncHold(record){
 const amount=Number(record.stage.style.getPropertyValue('--field-p'))||0;
 const mode=holdMode(amount,record.stage.dataset.fieldMode==='wrist');
 const label=mode==='gather'?'Hold to gather':'Hold to reveal the double';
 const ready=record.stage.classList.contains('has-field');
 for(const button of record.stage.querySelectorAll('[data-field-hold]')){
  const show=ready&&mode!=='off';
  if(!show){
   if(document.activeElement===button)button.blur();
   record.engine?.setSplit(false);
  }
  button.hidden=!show;
  button.disabled=!show;
  const name=button.querySelector('[data-hold-label]');
  if(show&&name&&name.textContent!==label)name.textContent=label;
 }
 const cue=record.stage.querySelector('[data-phase-cue]');
 if(cue&&cue.textContent!==phaseName(amount))cue.textContent=phaseName(amount);
}
function headerHeight(){return document.querySelector('.site-header')?.getBoundingClientRect().height||0;}
function progress(record){
 if(!record.engine)return;
 if(record.stage.dataset.fieldMode==='wrist'){record.engine.setProgress(.42);return;}
 const header=headerHeight();
 const rect=record.stage.getBoundingClientRect();
 const travel=Math.max(1,record.stage.offsetHeight-(innerHeight-header));
 const amount=Math.max(0,Math.min(1,(header-rect.top)/travel));
 record.engine.setProgress(amount);
 record.stage.style.setProperty('--field-p',amount.toFixed(4));
 record.stage.classList.toggle('is-settled',amount>=.94);
 syncHold(record);
}
function paintCanvas(record){
 const canvas=record.host.querySelector('canvas');
 if(!canvas)return;
 canvas.setAttribute('aria-hidden','true');
 canvas.style.width='100%';
 canvas.style.height='100%';
}
async function mount(stage){
 if(!eligible()||records.has(stage))return;
 const host=stage.querySelector('[data-particle-host]');if(!host)return;
 const abort=new AbortController();
 const record={stage,host,engine:null,abort};records.set(stage,record);
 const turn=epoch;
 try{
  const [{createSielonField},sources]=await Promise.all([import('./quantum-field.js?v=dust-v2'),fetch(new URL('./particle-sources.json',import.meta.url)).then(response=>{if(!response.ok)throw new Error('Portrait source configuration missing');return response.json();})]);
  if(matchMedia('(max-width: 1023px)').matches){
   sources.human.url='assets/home-v2/human-portrait-v2-640.webp';
   sources.si.url='assets/home-v2/si-portrait-v2-640.webp';
  }
  if(turn!==epoch||!eligible()||abort.signal.aborted){records.delete(stage);return;}
  const engine=await createSielonField(host,{sources,assemble:stage.hasAttribute('data-reveal'),onAvailability:available=>{
   stage.classList.toggle('has-field',available);
   const current=records.get(stage);
   if(!available||!current?.engine){
    stage.querySelectorAll('[data-field-hold]').forEach(button=>{button.hidden=!available;button.disabled=!available;});
    return;
   }
   syncHold(current);
  }});
  if(turn!==epoch||!eligible()||abort.signal.aborted){engine.destroy();records.delete(stage);stage.classList.remove('has-field');return;}
  record.engine=engine;
  engine.setReducedMotion(false);
  engine.setPaused(!!document.querySelector('dialog[open]'));
  paintCanvas(record);
  progress(record);
  syncHold(record);
  const signal=abort.signal;
  stage.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch'||event.target.closest('a,button,input,textarea'))return;
   const rect=host.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   engine.move((event.clientX-rect.left)/rect.width*2-1,(event.clientY-rect.top)/rect.height*2-1);
  },{passive:true,signal});
  stage.addEventListener('pointerleave',()=>release(record),{signal});
  addEventListener('blur',()=>release(record),{signal});
  for(const button of stage.querySelectorAll('[data-field-hold]')){
   button.addEventListener('pointerdown',event=>{if(event.button!==0)return;try{button.setPointerCapture(event.pointerId);}catch{/* already released */}engine.setSplit(true);},{signal});
   for(const type of ['pointerup','pointercancel','lostpointercapture','blur'])button.addEventListener(type,()=>release(record),{signal});
   button.addEventListener('keydown',event=>{
    if(event.key===' '||event.key==='Enter'){event.preventDefault();engine.setSplit(true);}
    else if(event.key==='Escape')release(record);
   },{signal});
   button.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();release(record);}},{signal});
  }
 }catch(error){
  records.delete(stage);stage.classList.remove('has-field');
  stage.querySelectorAll('[data-field-hold]').forEach(button=>{button.hidden=true;button.disabled=true;});
  console.warn('Optional SIELON particle scene unavailable:',error.message);
 }
}
function teardown(){
 epoch++;
 for(const record of records.values()){
  release(record);
  record.engine?.setReducedMotion(reduce.matches);
  record.abort?.abort();
  record.engine?.destroy();
  record.stage.classList.remove('has-field','is-settled');
  record.stage.querySelectorAll('[data-field-hold]').forEach(button=>{button.hidden=true;button.disabled=true;});
 }
 records.clear();
}
function stageVisible(stage){
 if(stage.hidden||stage.closest('[hidden]'))return false;
 return stage.getClientRects().length>0;
}
function sync(){
 teardown();
 if(!eligible())return;
 for(const stage of document.querySelectorAll('[data-field-stage]')){
  if(stage.dataset.fieldMode==='wrist'&&!stageVisible(stage))continue;
  if(!stageVisible(stage))continue;
  mount(stage);
 }
}
let scheduled=false;
addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;for(const record of records.values())progress(record);});},{passive:true});
addEventListener('resize',()=>{for(const record of records.values())progress(record);},{passive:true});
capable.addEventListener('change',sync);
reduce.addEventListener('change',()=>{
 for(const record of records.values())record.engine?.setReducedMotion(reduce.matches);
 sync();
});
document.addEventListener('sielon:field-open',sync);
document.addEventListener('sielon:modal',event=>{for(const record of records.values())record.engine?.setPaused(!!event.detail?.open);});
addEventListener('pageshow',event=>{if(event.persisted)sync();});
function boot(){requestAnimationFrame(()=>requestAnimationFrame(sync));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
