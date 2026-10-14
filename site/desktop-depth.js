/* Native opt-in photo-plane motion. No runtime dependencies. The particle field owns the opening. */
(() => {
  'use strict';
  if (window.SIELON_FILM_DEPTH_MOUNTED) return;
  window.SIELON_FILM_DEPTH_MOUNTED = true;
  const capable = matchMedia('(min-width:768px) and (hover:hover) and (pointer:fine)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const profiles = {
    teaser: { x:3.2, y:3.2, z:18 },
    paired: { x:3, y:3, z:20 },
    reveal: { x:2.4, y:2.4, z:22 },
    reaction: { x:3.5, y:3.5, z:20 },
    closing: { x:2, y:2, z:18 }
  };
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
  const states = Array.from(document.querySelectorAll('[data-film-depth]')).map(el => {
    const profile = profiles[el.dataset.filmDepth];
    if (!profile) return null;
    const base = clamp(Number(el.dataset.depthBaseY)||0,-profile.y,profile.y);
    return {el,profile,base,x:0,y:base,z:0,tx:0,ty:base,tz:0,visible:true,rect:null};
  }).filter(Boolean);
  let frame=0,previous=0;
  const enabled = () => capable.matches && !reduced.matches && !document.hidden;
  const write = state => {
    state.el.style.setProperty('--depth-rx',state.x.toFixed(3)+'deg');
    state.el.style.setProperty('--depth-ry',state.y.toFixed(3)+'deg');
    state.el.style.setProperty('--depth-z',state.z.toFixed(3)+'px');
  };
  const neutral = state => {state.tx=0;state.ty=state.base;state.tz=0;};
  const resetState = state => {
    neutral(state);state.x=0;state.y=state.base;state.z=0;write(state);
    state.el.style.removeProperty('--shine-x');state.el.style.removeProperty('--shine-y');
    delete state.el.dataset.depthActive;
  };
  const reset = () => {
    if (frame) cancelAnimationFrame(frame);
    frame=0;previous=0;states.forEach(resetState);
  };
  const tick = now => {
    frame=0;
    if (!enabled()) {reset();return;}
    const dt=previous ? Math.min(48,Math.max(1,now-previous)) : 16.7;
    previous=now;
    const mix=1-Math.exp(-dt/80);
    let unfinished=false;
    states.forEach(state => {
      if (!state.visible) return;
      for (const [value,target] of [['x','tx'],['y','ty'],['z','tz']]) {
        const delta=state[target]-state[value];
        state[value]=Math.abs(delta)<0.015 ? state[target] : state[value]+delta*mix;
        if (Math.abs(state[target]-state[value])>=0.015) unfinished=true;
      }
      write(state);
    });
    if (unfinished) frame=requestAnimationFrame(tick);
    else previous=0;
  };
  const schedule = () => {if (enabled() && !frame) frame=requestAnimationFrame(tick);};
  states.forEach(state => {
    const {el,profile}=state;
    el.addEventListener('pointerenter',event => {
      if (!enabled() || event.pointerType==='touch') return;
      state.rect=el.getBoundingClientRect();
    },{passive:true});
    el.addEventListener('pointermove',event => {
      if (!enabled() || !state.visible || event.pointerType==='touch') return;
      const rect=state.rect || el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x=clamp((event.clientX-rect.left)/rect.width*2-1,-1,1);
      const y=clamp((event.clientY-rect.top)/rect.height*2-1,-1,1);
      state.tx=clamp(-y*profile.x,-3.5,3.5);
      state.ty=clamp(state.base+x*profile.y,-3.5,3.5);
      state.tz=clamp(profile.z,0,24);
      el.style.setProperty('--shine-x',((x+1)*50).toFixed(1)+'%');
      el.style.setProperty('--shine-y',((y+1)*50).toFixed(1)+'%');
      el.dataset.depthActive='true';schedule();
    },{passive:true});
    el.addEventListener('pointerleave',() => {
      neutral(state);state.rect=null;delete el.dataset.depthActive;schedule();
    },{passive:true});
    el.addEventListener('focusin',() => {
      if (!enabled()) return;
      state.tx=0;state.ty=state.base;state.tz=Math.min(profile.z,8);schedule();
    });
    el.addEventListener('focusout',event => {
      if (!el.contains(event.relatedTarget)) {neutral(state);schedule();}
    });
    write(state);
  });
  if ('IntersectionObserver' in window) {
    const byElement=new Map(states.map(state=>[state.el,state]));
    const observer=new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state=byElement.get(entry.target);
        state.visible=entry.isIntersecting;
        if (!state.visible) resetState(state);
      });
    });
    states.forEach(state=>observer.observe(state.el));
  }
  capable.addEventListener('change',reset);
  reduced.addEventListener('change',reset);
  document.addEventListener('visibilitychange',reset);
  addEventListener('resize',()=>{states.forEach(state=>{state.rect=null;});reset();},{passive:true});
  addEventListener('scroll',()=>{states.forEach(state=>{state.rect=null;});},{passive:true});
})();
