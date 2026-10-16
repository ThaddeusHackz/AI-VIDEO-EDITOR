const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=0.4'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,T=window.__three,gl=film.renderer.getContext(),r=film.renderer;
  const TW=960,TH=540,COLS=4,ROWS=4;         // 16 tiles -> 3840x2160 atlas
  const rt=new T.WebGLRenderTarget(TW*COLS,TH*ROWS,{type:T.UnsignedByteType,depthBuffer:true});
  const out2=new T.WebGLRenderTarget(TW,TH,{type:T.UnsignedByteType});
  const results={};
  const runBatch=(n)=>{
    const t0=performance.now();
    for(let i=0;i<n;i++){
      const col=i%COLS,row=Math.floor(i/COLS);
      film.setFrame(6000+i);
      r.setRenderTarget(rt);
      r.setViewport(col*TW, (ROWS-1-row)*TH, TW, TH);
      r.setScissor(col*TW, (ROWS-1-row)*TH, TW, TH);
      r.setScissorTest(true);
      film.camera.aspect=TW/TH; film.camera.updateProjectionMatrix();
      r.clear();
      r.render(film.scene,film.camera);
    }
    const tAfterRender=performance.now();
    const buf=new Uint8Array(TW*TH*4);
    // single flush + readback of one tile (forces completion of everything)
    r.setRenderTarget(rt);
    gl.readPixels(0,0,TW,TH,gl.RGBA,gl.UNSIGNED_BYTE,buf);
    const tEnd=performance.now();
    r.setScissorTest(false);
    r.setViewport(0,0,r.domElement.width,r.domElement.height);
    r.setRenderTarget(null);
    film.camera.aspect=1;
    return {renderMs:+(tAfterRender-t0).toFixed(0), flushMs:+(tEnd-tAfterRender).toFixed(0), total:+(tEnd-t0).toFixed(0)};
  };
  results.batch1=runBatch(1);
  results.batch4=runBatch(4);
  results.batch8=runBatch(8);
  results.batch16=runBatch(16);
  return results;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
