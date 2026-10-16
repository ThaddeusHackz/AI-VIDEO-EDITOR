const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');const FF='/home/user/.cache/ffmpeg';
const shots=[['sword_attack','0.35'],['sword_block','0.2'],['punch_cross','0.25'],['jump_loop','1.0'],['roll','0.6'],['crouch_idle_loop','0.8'],['hit_chest','0.15'],['sprint_loop','0.2'],['jump_start','0.5']];
let H=null;
(async()=>{
 H=await launch({root:ROOT,windowWidth:760,windowHeight:760});
 const files=[];
 for(const [clip,t] of shots){
  await H.page.goto(H.url(`/tools/qtest.html?clip=${clip}&t=${t}`),{waitUntil:'load',timeout:120000});
  await H.page.waitForFunction('window.__ready===true',{timeout:120000});
  await new Promise(r=>setTimeout(r,600));
  const buf=await H.page.screenshot({type:'jpeg',quality:88});
  const f=path.join(ROOT,`probe/q_${clip}.jpg`); fs.writeFileSync(f,buf); files.push(f);
  console.log(clip,t,fs.statSync(f).size,'bytes');
 }
 const w=360;
 execFileSync(FF,['-y','-loglevel','error',...files.flatMap(f=>['-i',f]),'-filter_complex',
  `${files.map((_,k)=>`[${k}]scale=${w}:${w}[b${k}]`).join(';')};${files.map((_,k)=>`[b${k}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_,k)=>`${(k%3)*w}_${Math.floor(k/3)*w}`).join('|')}[o]`,
  '-map','[o]',path.join(ROOT,'probe/qtest.jpg')]);
 console.log('sheet',path.join(ROOT,'probe/qtest.jpg'),fs.statSync(path.join(ROOT,'probe/qtest.jpg')).size);
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,12).join('\n'));process.exit(1);});
