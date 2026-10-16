const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.15&quality=0.3'),{waitUntil:'load',timeout:300000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:600000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film, shots=window.__shots, rows=[];
  for(const shot of shots){
    const t=(shot.start+shot.end)/2, f=Math.round(t*60);
    film.warmTo(Math.max(0,f-4),2); film.setFrame(f);
    const blocking=film.blockingFor(shot,t);
    const per=[];
    for(const [id] of Object.entries(blocking)){
      const a=film.actors.get(id); if(!a||!a.root.visible) continue;
      const act=a.actions.get('base');
      const clip=act?act.getClip():null;
      per.push(id+'='+(clip?clip.name:'NONE')+(act?(act.isRunning()?'':' [stopped]'):''));
    }
    rows.push({shot:shot.id, t, actors:per});
  }
  return rows;
 })()`);
 for(const r of out) console.log(`shot#${String(r.shot).padStart(2)} t=${String(r.t).padStart(5)}s  ${r.actors.join('  ')}`);
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
