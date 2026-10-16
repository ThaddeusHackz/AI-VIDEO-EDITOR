const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.375&quality=0.6'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,r=film.renderer,gl=r.getContext();
  const rt=film.gradeRT,w=rt.width,h=rt.height;
  const buf=new Uint8Array(w*h*4);
  const frames=[600,2100,4500,6000,7800,9000,10200];
  film.warmTo(600,4);
  const t0=performance.now();
  for(let i=0;i<frames.length;i++){ film.setFrame(frames[i]); film.renderLean(); r.readRenderTargetPixels(rt,0,0,w,h,buf); }
  const t1=performance.now();
  return {size:[w,h], frames:frames.length, perFrameMs:+((t1-t0)/frames.length).toFixed(0), projectedHours:+(((t1-t0)/frames.length)*10800/3600000).toFixed(2)};
 })()`);
 console.log(JSON.stringify(out));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
