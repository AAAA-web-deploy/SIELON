export const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
export function smooth(a,b,x){const t=clamp((x-a)/(b-a));return t*t*(3-2*t);}
export function timeline(progress){const p=clamp(progress);return {wrist:smooth(.22,.48,p)*(1-smooth(.69,.88,p)),collapse:smooth(.49,.61,p)*(1-smooth(.64,.80,p)),pair:smooth(.72,.94,p),cloud:smooth(.04,.24,p)*(1-smooth(.90,1,p))};}
export function seedRandom(seed=42139){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
export function springStep(displacement,velocity,index,force,dt){
  const t=clamp(dt,.001,1/30);
  velocity[index]=(velocity[index]+(force-28*displacement[index])*t)*Math.exp(-6.2*t);
  displacement[index]=clamp(displacement[index]+velocity[index]*t,-1.4,1.4);
  if(Math.abs(displacement[index])<.00005&&Math.abs(velocity[index])<.00005){displacement[index]=0;velocity[index]=0;}
}
