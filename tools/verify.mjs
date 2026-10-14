import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {clamp,timeline,seedRandom,springStep} from '../site/quantum-math.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fail=[];const check=(ok,label)=>{if(!ok)fail.push(label);};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'design/ASSET_MANIFEST.json'),'utf8'));
for(const item of manifest){const file=path.join(root,item.file);check(fs.existsSync(file),'Missing '+item.file);if(fs.existsSync(file))check(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')===item.sha256,'Changed/corrupt '+item.file);}
const original=JSON.parse(fs.readFileSync(path.join(root,'design/APPROVED_STORY_COPY.json'),'utf8'));
check(original.scenes.length===10,'Expected ten protected story beats.');
check(original.scenes.at(-1).dialogue.at(-1).text==='SI will create our story too. Hopefully, it fixes my dancing.','Final joke differs.');
const reactions=JSON.parse(fs.readFileSync(path.join(root,'design/DESKTOP_SCENE_MAP.json'),'utf8'));
check(reactions.scenes.length===13,'Expected thirteen desktop film scenes.');
const randomA=seedRandom(73),randomB=seedRandom(73);
for(let i=0;i<200;i++)check(randomA()===randomB(),'Samples not deterministic.');
for(let i=-100;i<=1100;i++){
 const state=timeline(i/1000);
 for(const [key,value] of Object.entries(state))check(Number.isFinite(value)&&value>=0&&value<=1,'Invalid timeline '+key);
}
check(timeline(0).pair===0&&timeline(1).pair===1,'Opening/final formation incorrect.');
check(timeline(.60).collapse>.9&&timeline(1).collapse===0,'Collapse/reform lifecycle incorrect.');
const offset=new Float32Array([1,0,0]),velocity=new Float32Array([0,0,0]);
for(let i=0;i<1200;i++)springStep(offset,velocity,0,0,1/120);
check(Math.abs(offset[0])<.001&&Math.abs(velocity[0])<.001,'Spring does not return to its source.');
for(let i=0;i<1000;i++)springStep(offset,velocity,0,100000,1/60);
check(Number.isFinite(offset[0])&&Math.abs(offset[0])<=1.4001,'Particle displacement unbounded.');
const engine=await import('../site/quantum-field.js');check(typeof engine.createSielonField==='function','Engine import failed.');
for(const page of ['index.html','story.html']){
 const html=fs.readFileSync(path.join(root,'site',page),'utf8');
 check(html.includes('comparison-stack'),page+' mobile comparison baseline missing.');
 if(page==='story.html')check(html.includes('Download image'),page+' community image controls missing.');
 check(!/meme/i.test(html.replace(/class="[^"]*meme[^"]*"/g,'').replace(/data-meme-[a-z-]+/g,'')),page+' public meme wording remains.');
 check(!html.includes('vendor/three.min.js'),page+' must not download Three.js up front.');
 check(html.includes('Fictional story. No affiliation with Elon Musk.'),page+' fiction footer missing.');
 for(const item of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const value=item[1];if(/^(?:https?:|data:|mailto:|tel:)/.test(value))continue;
  check(fs.existsSync(path.join(root,'site',value.split('?')[0])),'Unresolved '+page+' path '+value);
 }
}
const home=fs.readFileSync(path.join(root,'site/index.html'),'utf8');
const story=fs.readFileSync(path.join(root,'site/story.html'),'utf8');
check(home.includes('data-field-stage')&&home.includes('href="story.html"'),'Desktop home opening missing.');
check(home.includes('canonical" href="https://sielon.world/"'),'Home canonical missing.');
check(story.includes('Which Elon is real?')&&story.includes('data-field-mode="wrist"'),'Desktop story sequence missing.');
check(story.includes('canonical" href="https://sielon.world/story.html"'),'Story canonical missing.');
check((story.match(/class="film /g)||[]).length===13,'Expected thirteen desktop film frames.');
check(story.includes('reaction-02-double-take-1440.webp'),'Corrected reaction still missing.');
if(fail.length){console.error(fail.join('\n'));process.exitCode=1;}else console.log('PASS: assets/hashes, protected story, desktop scene map, engine imports, bounded timelines, deterministic sampling and spring return. Final WebGL/layout verification remains for Cursor.');
