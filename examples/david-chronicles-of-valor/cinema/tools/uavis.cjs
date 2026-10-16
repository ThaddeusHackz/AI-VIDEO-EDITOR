const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');const FF='/home/user/.cache/ffmpeg';
const shots=process.argv[2] ? process.argv[2].split(',') : ['sword_attack@0.35','sword_block@0.2','punch_cross@0.25','jump_loop@1.0','roll@0.6','crouch_idle_loop@0.8','hit_chest@0.15','sprint_loop@0.2','jump_start@0.5'];
let H=null;
(async()=>{
 H=await launch({root:ROOT,windowWidth:660,windowHeight:660});
 const files=[];
 for(const s of shots){
  const [clip,t]=s.split('@');
  await H.page.goto(H.url(`/tools/uavis.html?clip=${clip}&t=${t||0.3}`),{waitUntil:'load',timeout:120000});
  await H.page.waitForFunction('window.__ready===true',{timeout:120000});
  await new Promise(r=>setTimeout(r,500));
  const info=await H.page.evaluate('window.__info');
  const f=path.join(ROOT,`probe/u_${clip}.jpg`); fs.writeFileSync(f,await H.page.screenshot({type:'jpeg',quality:88})); files.push(f);
  console.log(`${clip.padEnd(17)} t=${t} bound=${info.bound} bbox=${JSON.stringify(info.bbox)} dur=${info.duration}`);
 }
 const cols=3,w=340;
 execFileSync(FF,['-y','-loglevel','error',...files.flatMap(f=>['-i',f]),'-filter_complex',
  `${files.map((_,k)=>`[${k}]scale=${w}:${w}[b${k}]`).join(';')};${files.map((_,k)=>`[b${k}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_,k)=>`${(k%cols)*w}_${Math.floor(k/cols)*w}`).join('|')}[o]`,
  '-map','[o]',path.join(ROOT,'probe/ual-on-paladin.jpg')]);
 console.log('sheet',fs.statSync(path.join(ROOT,'probe/ual-on-paladin.jpg')).size,'bytes');
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,12).join('\n'));process.exit(1);});
