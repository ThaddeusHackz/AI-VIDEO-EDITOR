const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.15&quality=0.3'),{waitUntil:'load',timeout:300000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:600000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film;
  const probe=(t)=>{ const f=Math.round(t*60); film.warmTo(Math.max(0,f-4),2); film.setFrame(f);
    const shot=film.shot, blocking=film.blockingFor(shot,t), res=[];
    for(const [id] of Object.entries(blocking)){
      const a=film.actors.get(id); if(!a||!a.root.visible) continue;
      const acts=[];
      for(const [layer,act] of a.actions){
        const c=act&&act.getClip();
        acts.push({layer, clip:c?c.name:'-', run:act.isRunning(), paused:act.paused,
                   w:+act.getEffectiveWeight().toFixed(2), t:+act.time.toFixed(2),
                   loop:act.loop===2200?'once':act.loop===2201?'repeat':'?', ts:+act.getEffectiveTimeScale().toFixed(2)});
      }
      // also report whether the mixer itself has anything running
      res.push({id, acts});
    }
    return {shot:shot.id, name:shot.name, t, res};
  };
  return [probe(21), probe(22), probe(23), probe(24), probe(25)];
 })()`);
 for(const s of out){
   console.log(`\n=== shot#${s.shot} "${s.name}" t=${s.t}s ===`);
   for(const a of s.res){
     console.log('  ' + a.id + ':');
     for(const x of a.acts) console.log('     layer=' + String(x.layer).padEnd(6) + ' clip=' + String(x.clip).padEnd(34) +
       ' run=' + x.run + ' paused=' + x.paused + ' w=' + x.w + ' t=' + x.t + ' loop=' + x.loop + ' ts=' + x.ts);
   }
 }
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
