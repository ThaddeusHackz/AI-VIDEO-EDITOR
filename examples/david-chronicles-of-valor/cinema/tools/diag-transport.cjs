const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=1&quality=1'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 console.log('res',JSON.stringify(await H.page.evaluate('window.__info')));
 const out=await H.page.evaluate(`(async()=>{
  const film=window.__film;
  const res={};
  film.warmTo(6000,4); film.setFrame(6000); film.render();
  const gl=film.renderer.getContext();
  const W=3840,Hh=2160;
  const buf=new Uint8Array(W*Hh*4);
  let t0=performance.now();
  gl.readPixels(0,0,W,Hh,gl.RGBA,gl.UNSIGNED_BYTE,buf);
  res.readPixelsMs=+(performance.now()-t0).toFixed(0);
  res.nonBlack = (()=>{let s=0;for(let i=0;i<buf.length;i+=40000)s+=buf[i];return s>0;})();
  // webcodecs vp9 encode from canvas
  const chunks=[];
  let enc=null, err=null;
  try{
    enc=new VideoEncoder({output:(c)=>{chunks.push(c.byteLength);},error:(e)=>{err=String(e);}});
    enc.configure({codec:'vp09.00.10.08',width:W,height:Hh,bitrate:24_000_000,framerate:60,latencyMode:'quality'});
    const N=12;
    t0=performance.now();
    for(let i=0;i<N;i++){
      film.setFrame(6000+i); film.render();
      const vf=new VideoFrame(film.renderer.domElement,{timestamp:Math.round((6000+i)*1e6/60),duration:Math.round(1e6/60)});
      enc.encode(vf,{keyFrame:i===0});
      vf.close();
    }
    await enc.flush();
    res.vp9MsPerFrame=+((performance.now()-t0)/N).toFixed(0);
    res.vp9Chunks=chunks.length; res.vp9Bytes=chunks.reduce((a,b)=>a+b,0);
    await enc.close();
  }catch(e){ res.webcodecsError=String(e); }
  res.error=err;
  return res;
})()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
