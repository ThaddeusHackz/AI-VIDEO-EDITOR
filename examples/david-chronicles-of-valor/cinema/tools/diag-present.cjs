const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.5&quality=0.4'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,gl=film.renderer.getContext();
  const W=film.renderer.domElement.width,Hh=film.renderer.domElement.height;
  const buf=new Uint8Array(W*Hh*4);
  const flush=()=>{const t=performance.now();gl.readPixels(0,0,W,Hh,gl.RGBA,gl.UNSIGNED_BYTE,buf);return +(performance.now()-t).toFixed(0);};
  const r={size:[W,Hh]};
  film.setFrame(6000); film.render(); flush();
  // A: visible canvas
  r.visible=flush();
  // B: hidden canvas
  film.renderer.domElement.style.display='none';
  film.setFrame(6001); film.render();
  r.displayNone=flush();
  film.renderer.domElement.style.display='block';
  // C: off-screen canvas with the same scene
  const off=new OffscreenCanvas(W,Hh);
  const r2=new (window.__three.WebGLRenderer)({canvas:off, antialias:false, preserveDrawingBuffer:true});
  r2.setPixelRatio(1); r2.setSize(W,Hh,false);
  r2.toneMapping=window.__three.ACESFilmicToneMapping; r2.toneMappingExposure=1.05;
  film.setFrame(6002);
  r2.render(film.scene,film.camera);
  const g2=r2.getContext(); const b2=new Uint8Array(W*Hh*4);
  let t=performance.now(); g2.readPixels(0,0,W,Hh,g2.RGBA,g2.UNSIGNED_BYTE,b2); r.offscreenFirst=+(performance.now()-t).toFixed(0);
  t=performance.now(); g2.readPixels(0,0,W,Hh,g2.RGBA,g2.UNSIGNED_BYTE,b2); r.offscreenSecond=+(performance.now()-t).toFixed(0);
  // D: does the offscreen canvas see the same pixels?
  let diff=0; for(let i=0;i<buf.length;i+=9973) diff+=Math.abs(buf[i]-b2[i]);
  r.pixelDiffSample=diff;
  r2.dispose();
  return r;
 })()`);
 console.log(JSON.stringify(out));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
