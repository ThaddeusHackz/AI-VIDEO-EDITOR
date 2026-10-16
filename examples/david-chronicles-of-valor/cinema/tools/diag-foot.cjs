// Ground-contact audit. With the hips translation finally surviving the retarget (see
// diag-units.cjs), the actors' feet must still land on the terrain rather than inside it or
// floating above it. For every shot this samples frames and measures, per visible actor, the
// lowest foot bone against the terrain height under that foot:
//
//   penetration = terrain - minFootY   (>0  => the foot is inside the ground, i.e. visible clipping)
//   float       = minFootY - terrain   (>0  => no foot is touching: only legitimate mid-air)
//
// Reported per shot as the worst penetration, and the share of samples that are not within
// +-4 cm of the ground. Run it with and without the retarget fix to compare.
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

  const out = await H.page.evaluate(`(async()=>{
    const film=window.__film, T=window.__three, shots=window.__shots;
    const { terrainHeightAt } = await import('/src/world.js');
    const FOOT=/Foot$|ToeBase$|Foot_/i;
    const v=new T.Vector3();
    const rows=[];
    for(const shot of shots){
      const n=Math.max(6, Math.min(24, Math.round((shot.end-shot.start)*8)));
      const per=new Map();
      for(let i=0;i<=n;i++){
        const t=shot.start+(shot.end-shot.start)*i/n;
        const f=Math.round(t*60);
        if(i===0) film.warmTo(Math.max(0,f-4),2);
        film.setFrame(f);
        const blocking=film.blockingFor(shot,t);
        for(const id of Object.keys(blocking)){
          const a=film.actors.get(id); if(!a||!a.bones) continue;
          let low=Infinity, fx=0, fz=0;
          for(const b of a.bones.values()){
            if(!FOOT.test(b.name)) continue;
            b.getWorldPosition(v);
            if(v.y<low){ low=v.y; fx=v.x; fz=v.z; }
          }
          if(low===Infinity) continue;
          const g=terrainHeightAt(film.terrain,fx,fz);
          const s=per.get(id)||{pen:0,flt:0,n:0,near:0,frame:0};
          const d=g-low;                       // >0 => below ground
          if(d>s.pen){ s.pen=d; s.frame=f; }
          if(-d>s.flt) s.flt=-d;
          s.n++; if(Math.abs(d)<=0.04) s.near++;
          per.set(id,s);
        }
      }
      let pen=0,who=null,pf=0; let samp=0,near=0;
      for(const [id,s] of per){ if(s.pen>pen){pen=s.pen;who=id;pf=s.frame;} samp+=s.n; near+=s.near; }
      rows.push({shot:shot.id,label:shot.label||'',actors:per.size,samples:samp,
                 contactShare:samp?+(near/samp).toFixed(2):null,
                 worstPenetration:+pen.toFixed(3),worstActor:who,worstFrame:pf});
    }
    const pens=rows.map(r=>r.worstPenetration);
    return {rows, worst:Math.max(...pens), contactShare:+(rows.reduce((a,r)=>a+(r.samples?(r.contactShare*r.samples):0),0)/Math.max(1,rows.reduce((a,r)=>a+r.samples,0))).toFixed(3)};
  })()`);

  console.log('GROUND CONTACT (foot bone vs terrain, all visible actors, all shots)');
  console.log(`  worst penetration anywhere : ${out.worst} m`);
  console.log(`  samples within +-4 cm      : ${(out.contactShare * 100).toFixed(1)}%`);
  console.log('\nper shot:');
  for (const r of out.rows)
    console.log(`   shot#${String(r.shot).padStart(2)} actors=${String(r.actors).padStart(2)} samples=${String(r.samples).padStart(4)} contact=${String(r.contactShare).padStart(5)} worstPen=${String(r.worstPenetration).padStart(6)} m @f${String(r.worstFrame).padStart(5)} ${r.worstActor || '-'}`);
  await H.close();
})().catch(e => { console.error('FAIL', e.message); if (H && H.logs.length) console.error(H.logs.slice(0, 12).join('\n')); process.exit(1); });
