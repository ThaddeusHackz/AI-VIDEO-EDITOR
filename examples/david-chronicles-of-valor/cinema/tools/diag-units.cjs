// Unit + vertical-motion audit. Answers one question with numbers: when a clip that is authored
// with hips translation ("Jumping_Over_Into_Combat", "Falling_To_Roll", "roll", "jump_loop") is
// played, how far does the hips actually travel in the *scene's* metres — first on the raw source
// skeleton, then on the retargeted actor. If those two disagree by ~100x, the retarget's
// world-space unit conversion is wrong; if they agree and are small, the source clips are simply
// authored nearly in place and the height in the film comes from the choreography.
const path = require('node:path');
const { launch } = require('./harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const CLIPS = ['Jumping_Over_Into_Combat', 'Falling_To_Roll', 'roll', 'jump_start', 'jump_loop', 'hit_chest'];
let H = null;

(async () => {
  H = await launch({ root: ROOT });
  await H.page.goto(H.url('/tools/render.html?scale=0.15&quality=0.3'), { waitUntil: 'load', timeout: 300000 });
  await H.page.waitForFunction('window.__status==="ready"||String(window.__status).startsWith("error")', { timeout: 600000, polling: 500 });
  const st = await H.page.evaluate('window.__status');
  if (st !== 'ready') { console.error('status', st); process.exit(1); }

  const out = await H.page.evaluate(`(async()=>{
    const film=window.__film, T=window.__three;
    const { loadGLTF } = await import('/src/assets.js');
    const { clone: skClone } = await import('three/addons/utils/SkeletonUtils.js');
    const res={};

    const hipsOf = root => { let f=null; root.traverse(o=>{ if(!f&&/Hips$/i.test(o.name||'')) f=o; }); return f; };
    const sweep = (root, clip, name) => {          // world Y range of the hips over the clip, in metres
      const mixer=new T.AnimationMixer(root);
      const act=mixer.clipAction(clip); act.play();
      const h=hipsOf(root); if(!h) return null;
      let mn=Infinity,mx=-Infinity, p0=null;
      const N=90; const v=new T.Vector3();
      for(let i=0;i<=N;i++){
        mixer.setTime(clip.duration*i/N);
        root.updateMatrixWorld(true);
        h.getWorldPosition(v);
        if(!p0) p0=v.clone();
        if(v.y<mn)mn=v.y; if(v.y>mx)mx=v.y;
      }
      mixer.uncacheClip(clip); mixer.stopAllAction();
      return { clip:name, seconds:+clip.duration.toFixed(2), tracks:clip.tracks.length,
               restHipsY:+ (root===film.lib.base.scene ? null : 0) ,
               minY:+mn.toFixed(4), maxY:+mx.toFixed(4), range:+ (mx-mn).toFixed(4),
               startY:+p0.y.toFixed(4) };
    };

    // --- the raw source skeleton, straight from the file
    const g = await loadGLTF('/assets/anim/Jumping_Over_Into_Combat.glb');
    const rawClone = skClone(g.scene);
    res.rawFile={ hipsRestPos:[], armatureScale:null, hipsParentScale:null };
    const rh=hipsOf(rawClone);
    if(rh){ res.rawFile.hipsRestPos=rh.position.toArray().map(v=>+v.toFixed(3));
            res.rawFile.hipsParent=rh.parent?rh.parent.name:null;
            res.rawFile.hipsParentScale=rh.parent?rh.parent.scale.toArray().map(v=>+v.toFixed(4)):null; }
    res.rawSweep = sweep(rawClone, g.animations[0], 'Jumping_Over_Into_Combat (raw skeleton)');

    // --- the character rig, for reference heights and scales
    const a=film.actors.get('david');
    const ch=hipsOf(a.inner);
    const wp=ch.getWorldPosition(new T.Vector3());
    res.character={ armatureScale: ch.parent ? ch.parent.scale.toArray().map(v=>+v.toFixed(4)) : null,
                    hipsRestLocal: ch.position.toArray().map(v=>+v.toFixed(3)),
                    hipsRestWorldY: +wp.y.toFixed(3), innerScale:a.inner.scale.toArray() };

    // --- each binding-form of the same motions, played on a fresh clone of the character
    res.bound=[];
    for(const n of ${JSON.stringify(CLIPS)}){
      const clip=film.lib.clip(n); if(!clip){ res.bound.push({clip:n,missing:true}); continue; }
      const c=skClone(film.lib.base.scene);
      const r=sweep(c, clip, n);
      if(r) res.bound.push(r);
    }

    // --- what the film's own choreography adds on top (root Y keys)
    res.rootY={ shots:[] };
    for(const shot of window.__shots){
      let mn=Infinity,mx=-Infinity,who=null;
      for(let t=shot.start;t<=shot.end;t+=(shot.end-shot.start)/16){
        const f=Math.round(t*60); film.setFrame(f);
        const blocking=film.blockingFor(shot,t);
        for(const id of Object.keys(blocking)){
          const act=film.actors.get(id); if(!act) continue;
          const y=act.root.position.y;
          if(y<mn){mn=y;who=id;} if(y>mx)mx=y;
        }
      }
      if(mn!==Infinity) res.rootY.shots.push({shot:shot.id,min:+mn.toFixed(3),max:+mx.toFixed(3),range:+(mx-mn).toFixed(3),who});
    }
    return res;
  })()`);

  console.log('RAW SOURCE FILE');
  console.log('  hips rest local position :', out.rawFile.hipsRestPos, '| parent:', out.rawFile.hipsParent, 'scale', out.rawFile.hipsParentScale);
  console.log('  hips world-Y excursion over the clip (raw skeleton):', JSON.stringify(out.rawSweep));
  console.log('\nCHARACTER RIG');
  console.log(' ', JSON.stringify(out.character));
  console.log('\nRETARGETED CLIPS ON THE CHARACTER (world Y, metres)');
  for (const r of out.bound) {
    if (r.missing) { console.log(`   ${r.clip.padEnd(28)} not in library`); continue; }
    console.log(`   ${String(r.clip).padEnd(28)} ${String(r.seconds).padStart(5)}s  tracks=${String(r.tracks).padStart(3)}  hipsY ${r.minY} .. ${r.maxY}  range=${r.range} m`);
  }
  console.log('\nCHOREOGRAPHY ROOT-Y KEYS');
  for (const s of out.rootY.shots) console.log(`   shot#${String(s.shot).padStart(2)} rootY ${s.min} .. ${s.max}  range=${s.range} m   (${s.who})`);
  await H.close();
})().catch(e => { console.error('FAIL', e.message); if (H && H.logs.length) console.error(H.logs.slice(0, 12).join('\n')); process.exit(1); });
