const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 const scale=process.argv[2]||'0.5';
 H=await launch({root:ROOT});
 await H.page.goto(H.url(`/tools/render.html?scale=${scale}&quality=0.7`),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film, gl=film.renderer.getContext();
  const res={res:[film.renderer.domElement.width,film.renderer.domElement.height]};
  const W=film.renderer.domElement.width,Hh=film.renderer.domElement.height;
  const buf=new Uint8Array(W*Hh*4);
  const flush=()=>{const t=performance.now();gl.readPixels(0,0,4,4,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(64));return +(performance.now()-t).toFixed(0);};
  const rows=[];
  for (const f of [600, 6000, 9000, 10500]) {
    film.warmTo(f,4);
    film.setFrame(f);
    const t0=performance.now(); film.render(); const recMs=+(performance.now()-t0).toFixed(0);
    const t1=performance.now(); gl.readPixels(0,0,W,Hh,gl.RGBA,gl.UNSIGNED_BYTE,buf); const syncMs=+(performance.now()-t1).toFixed(0);
    const t2=performance.now(); gl.readPixels(0,0,W,Hh,gl.RGBA,gl.UNSIGNED_BYTE,buf); const secondMs=+(performance.now()-t2).toFixed(0);
    rows.push({f,recMs,syncMs,secondMs});
  }
  res.rows=rows;
  // full-tile readback of the whole frame after one flush (should be cheap)
  const t3=performance.now();
  gl.readPixels(0,0,W,Hh,gl.RGBA,gl.UNSIGNED_BYTE,buf);
  const s=''; // noop
  res.fullReadAfterFlushMs=+(performance.now()-t3).toFixed(0);
  return res;
 })()`);
 console.log(JSON.stringify(out));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
