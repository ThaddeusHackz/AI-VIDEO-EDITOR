// Motion audit — "does the actors' vertical/root translation actually reach the screen?"
//
// Why: tools/diag-tpose.cjs reports `hipsMove=0` for every actor instance. That single number is
// ambiguous — it can mean (a) the bound clips genuinely carry no hips translation (in-place
// source animation, which is normal for both Mixamo's in-place variants and the Quaternius UAL),
// or (b) hips translation exists but is being dropped/collapsed by the retarget or the root-motion
// strip. This script separates the two by measuring, in order:
//
//   1. CLIP level   — for every bound clip, the range of the `mixamorigHips.position` track
//                     against its own first sample (so an in-place clip reports ~0 and a clip with
//                     real translation reports its actual excursion, in the character's units).
//   2. SCREEN level — for every shot, sample the actor's *world* hips height across the shot and
//                     report the excursion per actor. This is what the audience sees, and it is
//                     independent of which layer (clip root motion vs. choreography) produces it.
//
// Truth table: clip range ~0 everywhere + screen range large = in-place clips, motion carried by
// the choreography (correct, and the `hipsMove=0` reading is a red herring). Clip range large +
// screen range ~0 = translation authored but lost. Both near 0 on a jump/roll cue = actors are
// sliding, and that would be a real defect.
const path = require('node:path');
const { launch } = require('./harness.cjs');
const ROOT = path.resolve(__dirname, '..');
let H = null;

(async () => {
  H = await launch({ root: ROOT });
  await H.page.goto(H.url('/tools/render.html?scale=0.15&quality=0.3'), { waitUntil: 'load', timeout: 300000 });
  await H.page.waitForFunction('window.__status==="ready"||String(window.__status).startsWith("error")', { timeout: 600000, polling: 500 });
  const st = await H.page.evaluate('window.__status');
  if (st !== 'ready') { console.error('status', st); process.exit(1); }

  const out = await H.page.evaluate(`(()=>{
    const film=window.__film, T=window.__three, shots=window.__shots;

    // ---- 1. clip level: does each bound clip carry hips translation at all?
    const clips=[];
    for(const [name,clip] of film.lib.clips){
      if(!clip) continue;
      const tr=clip.tracks.find(t=>/Hips\\.position$/i.test(t.name));
      if(!tr){ clips.push({name,track:false,range:0,axis0:0,axis1:0,axis2:0}); continue; }
      const v=tr.values, n=v.length/3;
      let lo=[Infinity,Infinity,Infinity], hi=[-Infinity,-Infinity,-Infinity], maxd=0;
      const a=[v[0],v[1],v[2]];
      for(let i=0;i<n;i++){
        for(let k=0;k<3;k++){ const x=v[i*3+k]; if(x<lo[k])lo[k]=x; if(x>hi[k])hi[k]=x; }
        const d=Math.hypot(v[i*3]-a[0],v[i*3+1]-a[1],v[i*3+2]-a[2]);
        if(d>maxd) maxd=d;
      }
      clips.push({name,track:true,keys:n,range:+maxd.toFixed(4),
                  axis0:+(hi[0]-lo[0]).toFixed(4),axis1:+(hi[1]-lo[1]).toFixed(4),axis2:+(hi[2]-lo[2]).toFixed(4)});
    }
    clips.sort((x,y)=>y.range-x.range);
    const moving=clips.filter(c=>c.range>0.01);

    // ---- 2. screen level: world hips excursion per actor, per shot
    const rows=[];
    for(const shot of shots){
      const dur=shot.end-shot.start;
      const step=Math.max(0.25, dur/24);           // ~24 samples per shot
      const seen=new Map();                        // id -> {min,max,rootMin,rootMax}
      let first=true;
      for(let t=shot.start;t<=shot.end+1e-6;t+=step){
        const f=Math.round(t*60);
        if(first){ film.warmTo(Math.max(0,f-4),2); first=false; }
        film.setFrame(f);
        const blocking=film.blockingFor(shot,t);
        for(const id of Object.keys(blocking)){
          const a=film.actors.get(id); if(!a) continue;
          // NB: a.bone(name) is an exact-name lookup, so a.bone('Hips') is always null on a
          // Mixamo rig and the whole measurement silently reads zero. Resolve the hips robustly.
          const b=a.hips || (a.bone&&a.bone('mixamorigHips')) ||
                  (a.bones&&[...a.bones.values()].find(x=>/Hips$/i.test(x.name)));
          if(!b) continue;
          const p=b.getWorldPosition(new T.Vector3());
          const rootY=a.root?a.root.getWorldPosition(new T.Vector3()).y:p.y;
          const s=seen.get(id)||{min:Infinity,max:-Infinity,rMin:Infinity,rMax:-Infinity};
          if(p.y<s.min)s.min=p.y; if(p.y>s.max)s.max=p.y;
          if(rootY<s.rMin)s.rMin=rootY; if(rootY>s.rMax)s.rMax=rootY;
          seen.set(id,s);
        }
      }
      let bestId=null, best=0;
      const per={};
      for(const [id,s] of seen){
        const d=s.max-s.min; per[id]=+d.toFixed(3);
        if(d>best){best=d;bestId=id;}
      }
      rows.push({shot:shot.id,label:shot.label||'',actors:seen.size,worst:bestId,maxHips:+best.toFixed(3),per});
    }
    return {clipCount:clips.length,movingClips:moving.length,
            topClips:clips.slice(0,12), zeroClips:clips.filter(c=>c.range<=0.01).map(c=>c.name),
            shots:rows,
            globalMax:+Math.max(...rows.map(r=>r.maxHips)).toFixed(3)};
  })()`);

  console.log('bound clips with a hips.position track: ' + out.clipCount);
  console.log('clips whose hips translation moves > 0.01 units: ' + out.movingClips);
  console.log('\nlargest hips-translation range per clip (character units, vs. its own first key):');
  for (const c of out.topClips)
    console.log(`   ${String(c.name).padEnd(22)} keys=${String(c.keys || 0).padStart(4)} range=${String(c.range).padStart(7)}  per-axis x/y/z = ${c.axis0} / ${c.axis1} / ${c.axis2}`);
  const z = out.zeroClips;
  console.log(`\nclips with no hips translation (in-place by authoring): ${z.length}` +
    (z.length ? '\n   ' + z.slice(0, 40).join(', ') + (z.length > 40 ? ' …' : '') : ''));

  console.log('\nON SCREEN — world hips height excursion (m) per shot, worst actor:');
  for (const r of out.shots)
    console.log(`   shot#${String(r.shot).padStart(2)} actors=${String(r.actors).padStart(2)} maxHips=${String(r.maxHips).padStart(6)} m  (${r.worst || '-'})  ${r.label}`);
  console.log(`\nglobal max on-screen hips excursion: ${out.globalMax} m`);
  await H.close();
})().catch(e => { console.error('FAIL', e.message); if (H && H.logs.length) console.error(H.logs.slice(0, 12).join('\n')); process.exit(1); });
