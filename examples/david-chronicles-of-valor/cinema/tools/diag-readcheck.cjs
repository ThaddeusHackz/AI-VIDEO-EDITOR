const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=0.6'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,r=film.renderer;
  film.warmTo(6000,4); film.renderLean();
  const rt=film.gradeRT,w=rt.width,h=rt.height;
  // A: whole-target read
  const a=new Uint8Array(w*h*4); r.readRenderTargetPixels(rt,0,0,w,h,a);
  // B: the strip path used by the film renderer
  const b=new Uint8Array(w*h*4);
  const tileH=64, strips=Math.ceil(h/tileH), row=new Uint8Array(w*tileH*4);
  const sync=new Uint8Array(4); r.readRenderTargetPixels(rt,0,0,1,1,sync);
  for(let s=0;s<strips;s++){const y=s*tileH,hh=Math.min(tileH,h-y);
    r.readRenderTargetPixels(rt,0,y,w,hh,row.subarray(0,w*hh*4));
    b.set(row.subarray(0,w*hh*4),(h-y-hh)*w*4);}
  let diff=0,maxd=0; for(let i=0;i<a.length;i+=4){const d=Math.abs(a[i]-b[i]); if(d){diff++;maxd=Math.max(maxd,d);}}
  // C: verify against a second full frame to make sure we are not reading a stale frame
  film.setFrame(6001); film.renderLean();
  const c=new Uint8Array(w*h*4); r.readRenderTargetPixels(rt,0,0,w,h,c);
  let diff2=0; for(let i=0;i<a.length;i+=997) diff2+=Math.abs(a[i]-c[i]);
  return {size:[w,h],stripMismatchPixels:diff,maxDelta:maxd,adjacentFrameDiff:diff2};
 })()`);
 console.log(JSON.stringify(out));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,15).join('\n'));process.exit(1);});
