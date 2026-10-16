// T-pose audit. For one frame per shot, measure how far each visible actor's *local* bone
// rotations have moved from the rig's rest pose. A clip that failed to bind leaves the actor at
// rest, which reads as a T/A-pose on screen, so a small deviation is a failure signal.
//
// Rigour note: the first version of this compared world quaternions against a field that did not
// exist, so every actor reported 0 bones and the "worst" table was empty noise. This version
// builds the rest map from the base character scene before any action is applied.
const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.15&quality=0.3'),{waitUntil:'load',timeout:300000});
 await H.page.waitForFunction('window.__status==="ready"||String(window.__status).startsWith("error")',{timeout:600000,polling:500});
 const st=await H.page.evaluate('window.__status'); if(st!=='ready'){console.error('status',st);process.exit(1);}
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film, T=window.__three, shots=window.__shots;
  // 1) rest pose of the base rig, in local space (clone-invariant)
  const rest=new Map();
  film.lib.base.scene.traverse(o=>{ if(o.isBone||o.isObject3D) rest.set(o.name, {q:o.quaternion.clone(), p:o.position.clone()}); });
  const ANGLE=(a,b)=>{ const d=Math.min(1,Math.abs(a.dot(b))); return 2*Math.acos(d); };
  const rows=[];
  for(const shot of shots){
    const t=(shot.start+shot.end)/2, f=Math.round(t*60);
    film.warmTo(Math.max(0,f-4),2); film.setFrame(f);
    const blocking=film.blockingFor(shot,t);
    for(const id of Object.keys(blocking)){
      const a=film.actors.get(id); if(!a) continue;
      let n=0, max=0, sum=0, moved=0, hipsDrop=0;
      a.inner.traverse(o=>{
        if(!o.isBone) return;
        const r=rest.get(o.name); if(!r) return;
        n++;
        const d=ANGLE(r.q, o.quaternion); sum+=d; if(d>max) max=d;
        if(d>0.06) moved++;                       // >3.4 deg counts as "this bone is posed"
      });
      // a.bone() is an exact-name lookup: a.bone('Hips') is always null on a Mixamo rig, which
      // silently zeroed this whole column. Resolve the hips robustly.
      const hips=a.hips||(a.bone&&a.bone('mixamorigHips'))||(a.bones&&[...a.bones.values()].find(x=>/Hips$/i.test(x.name)));
      if(hips){ const r=rest.get(hips.name); if(r) hipsDrop=hips.position.distanceTo(r.p); }
      rows.push({shot:shot.id, id, bones:n, movedPct:+(100*moved/Math.max(n,1)).toFixed(0),
                 maxDeg:+(max*180/Math.PI).toFixed(1), meanDeg:+((sum/Math.max(n,1))*180/Math.PI).toFixed(1),
                 hipsMove:+hipsDrop.toFixed(3), animating: n>10 && (max*180/Math.PI)>10});
    }
  }
  const still=rows.filter(r=>!r.animating);
  return {shots:shots.length, instances:rows.length, still, worst:rows.slice().sort((x,y)=>x.maxDeg-y.maxDeg).slice(0,12)};
 })()`);
 console.log('shots:',out.shots,'| actor instances:',out.instances);
 console.log('NOT animating:', out.still.length);
 for(const r of out.still) console.log(`   shot#${r.shot} ${r.id.padEnd(10)} bones=${r.bones} moved=${r.movedPct}% max=${r.maxDeg} deg`);
 console.log('\nlowest deviation (should all be well above 10 deg except deliberate idles):');
 for(const r of out.worst) console.log(`   shot#${String(r.shot).padStart(2)} ${r.id.padEnd(10)} bones=${String(r.bones).padStart(3)} moved=${String(r.movedPct).padStart(3)}% max=${String(r.maxDeg).padStart(6)} mean=${String(r.meanDeg).padStart(5)} hipsMove=${r.hipsMove}`);
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,12).join('\n'));process.exit(1);});
