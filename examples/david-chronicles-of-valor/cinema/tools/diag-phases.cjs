const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=0.7'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,r=film.renderer,gl=r.getContext();
  const prog=(n,fn)=>{ // run n iterations inside the page, one flush at the end
    const t0=performance.now(); fn(n); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));
    return +((performance.now()-t0)/n).toFixed(1);
  };
  const res={};
  res.setFrameOnly = prog(40, n=>{ for(let i=0;i<n;i++) film.setFrame(6000+i); });
  res.setFrameRender = prog(40, n=>{ for(let i=0;i<n;i++){ film.setFrame(6000+i); r.setRenderTarget(film.leanRT); r.clear(); r.render(film.scene,film.camera);} });
  res.setFrameRenderGrade = prog(40, n=>{ for(let i=0;i<n;i++){ film.setFrame(6000+i); film.renderLean(); } });
  res.fullReadback = prog(10, n=>{ const b=new Uint8Array(960*540*4); for(let i=0;i<n;i++) gl.readPixels(0,0,960,540,gl.RGBA,gl.UNSIGNED_BYTE,b); });
  res.leanPipeline = prog(20, n=>{
    const b=new Uint8Array(960*540*4);
    for(let i=0;i<n;i++){
      film.setFrame(6000+i); film.renderLean();
      // strip readback like the film renderer
      for(let s=0;s<9;s++){ r.readRenderTargetPixels(film.gradeRT,0,s*64,960,60,b); }
      btoa(String.fromCharCode.apply(null,b.subarray(0,65536)));
    }
  });
  res.pixels = [r.domElement.width, r.domElement.height];
  return res;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
