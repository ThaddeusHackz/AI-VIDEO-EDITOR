const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=1'),{waitUntil:'load',timeout:120000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 for (const f of [600, 2400, 9000]) {
   const out=await H.page.evaluate(`(()=>{
     const film=window.__film, T=window.__three;
     film.setFrame(${f});
     const cam=film.camera; cam.updateMatrixWorld(true);
     const res=[film.renderer.domElement.width, film.renderer.domElement.height];
     const res2=[];
     for (const [id,a] of film.actors){
       if(!a.root.visible) continue;
       const box=new T.Box3().setFromObject(a.root);
       const head=a.head? a.head.getWorldPosition(new T.Vector3()):null;
       const feet=new T.Vector3(a.root.position.x, a.root.position.y, a.root.position.z);
       const pv=v=>{const p=v.clone().project(cam);return [+p.x.toFixed(2),+p.y.toFixed(2)];};
       res2.push({id, root:a.root.position.toArray().map(v=>+v.toFixed(2)),
         box:[box.min.toArray().map(v=>+v.toFixed(2)),box.max.toArray().map(v=>+v.toFixed(2))],
         size:box.getSize(new T.Vector3()).toArray().map(v=>+v.toFixed(2)),
         headNDC: head?pv(head):null, feetNDC:pv(feet),
         dist:+cam.position.distanceTo(a.root.position).toFixed(2)});
     }
     return {frame:${f}, time:+film.time.toFixed(2), shot:film.shot.id,
       cam:{pos:cam.position.toArray().map(v=>+v.toFixed(2)),fov:cam.fov, dir:cam.getWorldDirection(new T.Vector3()).toArray().map(v=>+v.toFixed(2))},
       actors:res2};
   })()`);
   console.log(JSON.stringify(out));
 }
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.join('\n'));process.exit(1);});
