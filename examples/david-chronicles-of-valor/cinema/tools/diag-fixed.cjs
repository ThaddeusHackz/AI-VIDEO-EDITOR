const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=0.4'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,T=window.__three,gl=film.renderer.getContext(),r=film.renderer;
  const res={};
  const t=(fn,n=3)=>{let s=0;for(let i=0;i<n;i++){const a=performance.now();fn();s+=performance.now()-a;}return +(s/n).toFixed(1);};
  res.preserveDrawingBuffer = r.getContextAttributes().preserveDrawingBuffer;
  const rt=new T.WebGLRenderTarget(480,270,{type:T.UnsignedByteType});
  const buf=new Uint8Array(480*270*4);
  r.setRenderTarget(rt);
  res.clearOnly = t(()=>{ r.clear(); gl.finish&&gl.finish(); });
  res.clearAndRead = t(()=>{ const b=new Uint8Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,b); });
  res.fullRead480 = t(()=>{ gl.readPixels(0,0,480,270,gl.RGBA,gl.UNSIGNED_BYTE,buf); });
  const skyOnly=()=>{ r.clear(); film.sky.visible=true; const save=[film.sky.visible]; 
    for(const o of film.scene.children) if(o!==film.sky) o.visible=false;
    r.render(film.scene,film.camera);
    for(const o of film.scene.children) o.visible=true; };
  res.skyOnly = t(skyOnly);
  // backbuffer: how expensive is the default framebuffer clear/setup
  r.setRenderTarget(null);
  res.backbufferClear = t(()=>{ r.clear(); });
  res.setRTnull = t(()=>{ r.setRenderTarget(null); });
  res.setRT = t(()=>{ r.setRenderTarget(rt); });
  return res;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
