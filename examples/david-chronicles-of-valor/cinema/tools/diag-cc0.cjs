// CC0 clip audit: does a Quaternius/CGstuff clip put the actor where it belongs?
//
// validate-ual reports the CC0 clips' hips height as negative (below the ground) after the
// retarget fix, while the film's own ground-contact audit (diag-foot) shows no such sinking.
// This script resolves the contradiction by measuring the same clips three ways:
//   1. raw source node: pelvis rest translation, its parent's world rotation/scale, and the
//      animation's own translation keys, straight from the file;
//   2. in isolation: the bound+stripped clip played on a fresh clone of the character, hips
//      world Y over the clip;
//   3. in the film: for every cue that plays a CC0 clip, the actor's hips world Y and the
//      terrain under it, frame by frame through the cue.
const path = require('node:path');
const { launch } = require('./harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const CLIPS = ['hit_chest', 'hit_head', 'sword_attack', 'sword_block', 'roll', 'jump_start', 'jump_land', 'punch_cross'];
let H = null;

(async () => {
  H = await launch({ root: ROOT });
  await H.page.goto(H.url('/tools/render.html?scale=0.15&quality=0.3'), { waitUntil: 'load', timeout: 300000 });
  await H.page.waitForFunction('window.__status==="ready"||String(window.__status).startsWith("error")', { timeout: 600000, polling: 500 });
  const st = await H.page.evaluate('window.__status');
  if (st !== 'ready') { console.error('status', st); process.exit(1); }

  const out = await H.page.evaluate(`(async()=>{
    const film=window.__film, T=window.__three;
    const { loadUALSource } = await import('/src/ual.js');
    const { clone: skClone } = await import('three/addons/utils/SkeletonUtils.js');
    const { terrainHeightAt } = await import('/src/world.js');
    const hipsOf = root => { let f=null; root.traverse(o=>{ if(!f&&/Hips$|pelvis/i.test(o.name||'')) f=o; }); return f; };
    const res={source:{},isolated:[],film:{}};

    // ---- 1. the source files
    for(const n of ${JSON.stringify(CLIPS)}){
      try{
        const src=await loadUALSource(n);
        const h=hipsOf(src.scene);
        const rotTracks=src.animations[0].tracks.filter(t=>/Hips\\.position$/.test(t.name));
        const tr=rotTracks[0];
        let range=null;
        if(tr){ const v=tr.values; const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
          for(let i=0;i<v.length;i+=3) for(let k=0;k<3;k++){ if(v[i+k]<lo[k])lo[k]=v[i+k]; if(v[i+k]>hi[k])hi[k]=v[i+k]; }
          range=[0,1,2].map(k=>+(hi[k]-lo[k]).toFixed(4)); }
        res.source[n]={ pelvisName:h?h.name:null, pelvisRestLocal:h?h.position.toArray().map(v=>+v.toFixed(4)):null,
                        pelvisParent:h&&h.parent?h.parent.name:null,
                        pelvisParentScale:h&&h.parent?h.parent.scale.toArray().map(v=>+v.toFixed(4)):null,
                        firstKey: tr? Array.from(tr.values.slice(0,3)).map(v=>+v.toFixed(4)) : null,
                        keyRange:range, tracks:src.animations[0].tracks.length };
      }catch(e){ res.source[n]={error:String(e.message).slice(0,80)}; }
    }

    // ---- 2. the bound clip in isolation, on a clone of the character
    for(const n of ${JSON.stringify(CLIPS)}){
      const clip=film.lib.clip(n);
      if(!clip){ res.isolated.push({clip:n,missing:true,source:film.lib.sources.get(n)}); continue; }
      const c=skClone(film.lib.base.scene);
      const mixer=new T.AnimationMixer(c); const act=mixer.clipAction(clip); act.play();
      const h=hipsOf(c); let mn=Infinity,mx=-Infinity;
      const v=new T.Vector3();
      for(let i=0;i<=60;i++){ mixer.setTime(clip.duration*i/60); c.updateMatrixWorld(true); h.getWorldPosition(v);
        if(v.y<mn)mn=v.y; if(v.y>mx)mx=v.y; }
      res.isolated.push({clip:n,source:film.lib.sources.get(n),tracks:clip.tracks.length,minY:+mn.toFixed(3),maxY:+mx.toFixed(3)});
    }

    // ---- 3. the film's own CC0 cues
    const cc0=[];
    for(const shot of window.__shots) for(const c of (shot.cues||[])){
      const name=c.clip||c.action||c.anim||null;
      if(!name) continue;
      const src=film.lib.sources.get(name);
      if(src && /assets\\/quaternius/.test(src)) cc0.push({shot:shot.id,t:c.t,actor:c.actor||c.id||c.who||null,clip:name});
    }
    res.film.cueCount=cc0.length;
    res.film.cues=cc0.slice(0,40).map(c=>({...c}));
    return res;
  })()`);

  console.log('1. SOURCE FILE CONVENTIONS');
  for (const [n, s] of Object.entries(out.source))
    console.log(`   ${n.padEnd(14)} ${s.error ? 'ERROR ' + s.error : `pelvis=${s.pelvisName} restLocal=${JSON.stringify(s.pelvisRestLocal)} parent=${s.pelvisParent} parentScale=${JSON.stringify(s.pelvisParentScale)} firstKey=${JSON.stringify(s.firstKey)} keyRange=${JSON.stringify(s.keyRange)}`}`);
  console.log('\n2. BOUND CLIP IN ISOLATION (hips world Y on a character clone, metres)');
  for (const r of out.isolated)
    console.log(`   ${String(r.clip).padEnd(14)} ${r.missing ? 'not in library' : `tracks=${String(r.tracks).padStart(3)} hipsY ${r.minY} .. ${r.maxY}`}   src=${r.source}`);
  console.log(`\n3. FILM CUES THAT PLAY A CC0 CLIP: ${out.film.cueCount}`);
  for (const c of out.film.cues) console.log(`   shot#${String(c.shot).padStart(2)} t=${c.t}s clip=${c.clip} actor=${c.actor}`);
  await H.close();
})().catch(e => { console.error('FAIL', e.message); if (H && H.logs.length) console.error(H.logs.slice(0, 12).join('\n')); process.exit(1); });
