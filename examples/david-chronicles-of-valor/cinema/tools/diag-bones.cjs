const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=1'),{waitUntil:'load',timeout:120000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
   const film=window.__film,T=window.__three;
   const a=film.actors.get('david');
   const res={};
   res.innerScale=a.inner.scale.toArray();
   res.innerChildren=a.inner.children.map(c=>({name:c.name,type:c.type,scale:c.scale.toArray(),pos:c.position.toArray().map(v=>+v.toFixed(3))}));
   const skinned=[];a.inner.traverse(o=>{if(o.isSkinnedMesh){o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox;skinned.push({name:o.name,scale:o.scale.toArray(),matrixScale:o.getWorldScale(new T.Vector3()).toArray().map(v=>+v.toFixed(4)),geoBox:[bb.min.toArray().map(v=>+v.toFixed(2)),bb.max.toArray().map(v=>+v.toFixed(2))],bones:o.skeleton.bones.length});}});
   res.skinned=skinned;
   const hips=a.bone('mixamorigHips');
   res.hips={pos:hips.position.toArray().map(v=>+v.toFixed(3)),scale:hips.scale.toArray().map(v=>+v.toFixed(3))};
   const arm=a.bone('mixamorigRightArm')||a.bone('mixamorigLeftArm');
   if(arm) res.arm={pos:arm.position.toArray().map(v=>+v.toFixed(3)),scale:arm.scale.toArray().map(v=>+v.toFixed(3))};
   film.setFrame(600);
   res.afterHips={pos:hips.position.toArray().map(v=>+v.toFixed(3)),scale:hips.scale.toArray().map(v=>+v.toFixed(3)),wscale:hips.getWorldScale(new T.Vector3()).toArray().map(v=>+v.toFixed(3))};
   res.actions=[...a.actions].map(([k,act])=>({layer:k,clip:act.getClip().name,t:+act.time.toFixed(3),w:act.getEffectiveWeight(),ts:act.getEffectiveTimeScale(),paused:act.paused,enabled:act.enabled}));
   // what clips exist and their hips position range
   for (const [n,cl] of film.lib.clips){ const t=cl.tracks.find(t=>t.name==='mixamorigHips.position'); if(t){let minY=1e9,maxY=-1e9;for(let i=1;i<t.values.length;i+=3){minY=Math.min(minY,t.values[i]);maxY=Math.max(maxY,t.values[i]);} res['hipsRange_'+n]=[+minY.toFixed(2),+maxY.toFixed(2)];} }
   res.clipNames=[...film.lib.clips.keys()].length;
   return res;
 })()`);
 console.log(JSON.stringify(out,null,1).slice(0,4000));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.join('\n'));process.exit(1);});
