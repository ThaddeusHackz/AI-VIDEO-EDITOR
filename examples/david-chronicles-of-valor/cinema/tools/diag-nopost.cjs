const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=0.6'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,T=window.__three,gl=film.renderer.getContext(),r=film.renderer;
  const rows=[];
  for (const [TW,TH] of [[480,270],[640,360],[854,480],[960,540],[1280,720]]) {
    const rt=new T.WebGLRenderTarget(TW,TH,{type:T.UnsignedByteType});
    const buf=new Uint8Array(TW*TH*4);
    const times=[];
    for(let i=0;i<4;i++){
      film.warmTo(6000+i*3,4); film.setFrame(6000+i*3);
      film.camera.aspect=TW/TH; film.camera.updateProjectionMatrix();
      r.setRenderTarget(rt);
      const t=performance.now();
      r.clear(); r.render(film.scene,film.camera);
      gl.readPixels(0,0,TW,TH,gl.RGBA,gl.UNSIGNED_BYTE,buf);
      times.push(+(performance.now()-t).toFixed(0));
    }
    times.sort((a,b)=>a-b);
    rows.push({size:TW+'x'+TH, median:times[1], all:times});
    rt.dispose();
  }
  // with a single-pass grade shader on top (cheap post)
  const grade=(w,h)=>{
    const grt=new T.WebGLRenderTarget(w,h,{type:T.UnsignedByteType});
    const quad=new T.Mesh(new T.PlaneGeometry(2,2), new T.ShaderMaterial({
      uniforms:{tDiffuse:{value:null}},
      vertexShader:'varying vec2 v; void main(){v=uv; gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse; varying vec2 v; void main(){ vec4 c=texture2D(tDiffuse,v); float l=dot(c.rgb,vec3(.21,.72,.07)); c.rgb=mix(vec3(l),c.rgb,1.06); c.rgb*=1.04; gl_FragColor=c; }'}));
    const sc=new T.Scene(); sc.add(quad); const cam2=new T.OrthographicCamera(-1,1,1,-1,0,1);
    return (srcRT)=>{ quad.material.uniforms.tDiffuse.value=srcRT.texture; r.setRenderTarget(grt); r.clear(); r.render(sc,cam2); r.setRenderTarget(null); return grt; };
  };
  return rows;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
