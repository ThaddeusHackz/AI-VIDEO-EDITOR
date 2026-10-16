const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.2&quality=0.4'),{waitUntil:'load',timeout:240000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,T=window.__three,rows=[];
  for(const f of [30,240,480]){
    film.warmTo(Math.max(0,f-3),2); film.setFrame(f);
    const a=film.actors.get('david');
    const hb=a.bone&&a.bone('Head'), hips=a.bone&&a.bone('Hips');
    const p=new T.Vector3(), q=new T.Vector3();
    if(hb) hb.getWorldPosition(p); if(hips) hips.getWorldPosition(q);
    const box=new T.Box3().setFromObject(a.inner);
    const c=film.camera;
    rows.push({f, feet:[+a.root.position.x.toFixed(2),+a.root.position.y.toFixed(2),+a.root.position.z.toFixed(2)],
      head:[+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)], hips:[+q.x.toFixed(2),+q.y.toFixed(2),+q.z.toFixed(2)],
      bbox:[+box.min.y.toFixed(2),+box.max.y.toFixed(2)],
      cam:[+c.position.x.toFixed(2),+c.position.y.toFixed(2),+c.position.z.toFixed(2)],
      camToHead:+c.position.distanceTo(p).toFixed(2)});
  }
  return rows;
 })()`);
 for(const r of out) console.log(JSON.stringify(r));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,8).join('\n'));process.exit(1);});
