const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
const FF='/home/user/.cache/ffmpeg';
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=0.6'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,r=film.renderer;
  film.setFrame(600); film.renderLean();
  const rt=film.gradeRT,w=rt.width,h=rt.height;
  const a=new Uint8Array(w*h*4);
  const t0=performance.now(); r.readRenderTargetPixels(rt,0,0,w,h,a); const t1=performance.now();
  // strip path
  const b=new Uint8Array(w*h*4);
  const tileH=64,strips=Math.ceil(h/tileH),row=new Uint8Array(w*tileH*4);
  const sync=new Uint8Array(4); r.readRenderTargetPixels(rt,0,0,1,1,sync);
  const t2=performance.now();
  for(let s=0;s<strips;s++){const y=s*tileH,hh=Math.min(tileH,h-y);
    r.readRenderTargetPixels(rt,0,y,w,hh,row.subarray(0,w*hh*4));
    b.set(row.subarray(0,w*hh*4),(h-y-hh)*w*4);}
  const t3=performance.now();
  // per-frame cost of the simple full-read pipeline
  const t4=performance.now();
  for(let i=0;i<20;i++){ film.setFrame(600+i); film.renderLean(); r.readRenderTargetPixels(rt,0,0,w,h,a); }
  const t5=performance.now();
  const b64=(()=>{let s='';const CH=0x8000;for(let i=0;i<a.length;i+=CH)s+=String.fromCharCode.apply(null,a.subarray(i,i+CH));return btoa(s);})();
  return {size:[w,h],fullReadMs:+(t1-t0).toFixed(0),stripMs:+(t3-t2).toFixed(0),fullPipelineMsPerFrame:+((t5-t4)/20).toFixed(0),b64:a2b64(a)};
  function a2b64(u){let s='';const CH=0x8000;for(let i=0;i<u.length;i+=CH)s+=String.fromCharCode.apply(null,u.subarray(i,i+CH));return btoa(s);}
 })()`);
 const {b64,w,h}=out;
 const buf=Buffer.from(out.b64,'base64');
 const w2=out.size[0],h2=out.size[1];
 const rgb=Buffer.allocUnsafe(w2*h2*3);
 for(let i=0;i<w2*h2;i++){const k=i*4;rgb[i*3]=buf[k];rgb[i*3+1]=buf[k+1];rgb[i*3+2]=buf[k+2];}
 fs.writeFileSync(path.join(ROOT,'probe/fullread.ppm'),Buffer.concat([Buffer.from(`P6\n${w2} ${h2}\n255\n`),rgb]));
 execFileSync(FF,['-y','-loglevel','error','-i',path.join(ROOT,'probe/fullread.ppm'),'-q:v','3',path.join(ROOT,'probe/fullread.jpg')]);
 console.log('fullReadMs',out.fullReadMs,'stripMs',out.stripMs,'pipelineMs/frame',out.fullPipelineMsPerFrame);
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,15).join('\n'));process.exit(1);});
