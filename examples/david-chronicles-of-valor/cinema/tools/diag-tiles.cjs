const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=1&quality=1'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film, gl=film.renderer.getContext();
  const res={};
  const read=(w,h)=>{const buf=new Uint8Array(w*h*4);const t0=performance.now();for(let i=0;i<3;i++)gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);return +((performance.now()-t0)/3).toFixed(0);};
  film.warmTo(6000,4); film.setFrame(6000); film.render();
  for (const [w,h] of [[960,540],[1280,720],[1920,1080],[1024,1024],[2048,512],[3840,540],[960,2160],[4096,512],[2560,720],[768,432],[512,512],[640,360]]) {
    res[w+'x'+h]=read(w,h);
  }
  // tiled full-frame readback (16 tiles of 960x540)
  film.setFrame(6001); film.render();
  const t0=performance.now();
  const tileW=960,tileH=540;
  const full=new Uint8Array(3840*2160*4);
  const row=new Uint8Array(tileW*tileH*4);
  for(let ty=0;ty<4;ty++){ for(let tx=0;tx<4;tx++){
    gl.readPixels(tx*tileW, ty*tileH, tileW, tileH, gl.RGBA, gl.UNSIGNED_BYTE, row);
    for(let r=0;r<tileH;r++){ const src=r*tileW*4; const dst=((ty*tileH+r)*3840 + tx*tileW)*4; full.set(row.subarray(src,src+tileW*4), dst); }
  }}
  res.tiledFullMs=+(performance.now()-t0).toFixed(0);
  // base64 transfer cost (estimate what CDP would move)
  let b64len=0;
  const t1=performance.now();
  const chunk=full.subarray(0, 8*1024*1024);
  let s=''; for(let i=0;i<chunk.length;i+=3){ s+=String.fromCharCode(chunk[i]); }
  res.jsStringProbeMs=+(performance.now()-t1).toFixed(0);
  return res;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
