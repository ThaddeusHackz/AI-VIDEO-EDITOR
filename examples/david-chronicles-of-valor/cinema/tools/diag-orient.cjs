const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');const FF='/home/user/.cache/ffmpeg';
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=0.6'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,r=film.renderer;
  film.setFrame(600); film.renderLean();
  const rt=film.gradeRT,w=rt.width,h=rt.height;
  const raw=new Uint8Array(w*h*4); r.readRenderTargetPixels(rt,0,0,w,h,raw);
  const rowMean=(y)=>{let s=0;for(let x=0;x<w;x+=7){const k=(y*w+x)*4;s+=raw[k]+raw[k+1]+raw[k+2];}return s/(Math.ceil(w/7)*3);};
  const top=rowMean(20), bottom=rowMean(h-40);
  return {rawTopMean:+top.toFixed(1), rawBottomMean:+bottom.toFixed(1),
          interpretation: top>bottom ? 'raw rows are bottom-up (sky in the last rows)' : 'raw rows are top-down'};
 })()`);
 console.log(JSON.stringify(out));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
