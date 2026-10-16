const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 const scale=process.argv[2]||'0.25';
 H=await launch({root:ROOT});
 await H.page.goto(H.url(`/tools/render.html?scale=${scale}&quality=0.6`),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,r=film.renderer;
  const rt=film.gradeRT,w=rt.width,h=rt.height,buf=new Uint8Array(w*h*4);
  const frames=[600,2100,4500,6000,7800,9000,10200];
  film.warmTo(600,4);
  let t=performance.now();
  for(const f of frames){ film.setFrame(f); film.renderLean(); }
  const renderOnly=(performance.now()-t)/frames.length;
  t=performance.now();
  for(const f of frames){ r.readRenderTargetPixels(rt,0,0,w,h,buf); }
  const readOnly=(performance.now()-frames.length*0-((0))); // placeholder
  const t2=performance.now();
  for(const f of frames){ r.readRenderTargetPixels(rt,0,0,w,h,buf); }
  const readPerFrame=(performance.now()-t2)/frames.length;
  return {size:[w,h], renderOnlyMs:+renderOnly.toFixed(0), readPerFrameMs:+readPerFrame.toFixed(0),
          totalMs:+(renderOnly+readPerFrame).toFixed(0), hours:+( (renderOnly+readPerFrame)*10800/3600000).toFixed(2)};
 })()`);
 console.log(JSON.stringify(out));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
