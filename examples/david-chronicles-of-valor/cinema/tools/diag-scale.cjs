// Measures render-only cost per frame at several internal resolutions, with no readback inside
// the loop (the lesson: a synchronous GL read is a full pipeline flush, not a transfer).
const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT,windowWidth:1280,windowHeight:720});
 const scales=[0.25,0.5,0.75,1.0];
 const res={};
 for(const sc of scales){
  await H.page.goto(H.url(`/tools/render.html?scale=${sc}&quality=0.6`),{waitUntil:'load',timeout:240000});
  await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
  const out=await H.page.evaluate(`(()=>{
   const film=window.__film,r=film.renderer,gl=r.getContext();
   const rt=film.gradeRT,w=rt.width,h=rt.height;
   const frames=[600,2100,4500,6000,7800,9000,10200,120,3000];
   film.warmTo(600,3);
   const t0=performance.now();
   for(let i=0;i<frames.length;i++){ film.setFrame(frames[i]); film.renderLean(); }
   // flush the whole queue with ONE read
   const b=new Uint8Array(w*h*4); r.readRenderTargetPixels(rt,0,0,w,h,b);
   const t1=performance.now();
   return {size:[w,h],n:frames.length,msPerFrame:+((t1-t0)/frames.length).toFixed(0),b64Bytes:Math.ceil(w*h*4*4/3)};
  })()`);
  res[sc]=out;
  console.log(JSON.stringify(out),'->',(out.msPerFrame*10800/3600000).toFixed(2),'h for 10800 frames');
 }
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
