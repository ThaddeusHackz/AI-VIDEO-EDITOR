const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=1'),{waitUntil:'load',timeout:120000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
   const film=window.__film,T=window.__three;
   const a=film.actors.get('david');
   const names=['mixamorigHips','mixamorigHead','mixamorigRightHand'];
   const res={};
   for(const n of names){
     const hits=[];
     a.inner.traverse(o=>{ if(o.name===n) hits.push({type:o.type,parent:o.parent&&o.parent.name,local:o.position.toArray().map(v=>+v.toFixed(4)),wscale:o.getWorldScale(new T.Vector3()).toArray().map(v=>+v.toFixed(4)),isBone:o.isBone}); });
     res[n]=hits;
   }
   res.totalNamed=(()=>{const s=new Set();a.inner.traverse(o=>{if(o.name)s.add(o.name)});return s.size})();
   res.totalNodes=(()=>{let c=0;a.inner.traverse(()=>c++);return c})();
   res.skinnedBones=(()=>{const m=[];a.inner.traverse(o=>{if(o.isSkinnedMesh)m.push({name:o.name,bones:o.skeleton.bones.length,firstBones:o.skeleton.bones.slice(0,3).map(b=>b.name)})});return m})();
   return res;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.join('\n'));process.exit(1);});
