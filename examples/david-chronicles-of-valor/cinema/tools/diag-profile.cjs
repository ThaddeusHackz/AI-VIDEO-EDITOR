const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.5&quality=0.7'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,T=window.__three,gl=film.renderer.getContext();
  const W=film.renderer.domElement.width,Hh=film.renderer.domElement.height;
  const buf=new Uint8Array(W*Hh*4);
  const ms=fn=>{film.setFrame(6000);fn&&fn();const t=performance.now();film.render();gl.readPixels(0,0,W,Hh,gl.RGBA,gl.UNSIGNED_BYTE,buf);return +(performance.now()-t).toFixed(0);};
  const r={};
  r.baseline=ms();
  // no shadows
  const sh=film.renderer.shadowMap.enabled; film.renderer.shadowMap.enabled=false;
  r.noShadows=ms(); film.renderer.shadowMap.enabled=sh;
  // no bloom
  const bs=film.bloom.strength; film.bloom.enabled=false; r.noBloom=ms(); film.bloom.enabled=true;
  // no post at all
  const oldRender=film.render.bind(film);
  film.render=function(){ this.renderer.autoClear=false; this.renderer.setRenderTarget(null);
    this.renderer.clear(); this.renderer.render(this.scene,this.camera); this.renderer.autoClear=true; return this; };
  r.sceneOnly=ms(); film.render=oldRender;
  // scene only, no shadows, no sky
  film.sky.visible=false; film.renderer.shadowMap.enabled=false;
  r.sceneNoSkyNoShadow=ms();
  // also no crowd
  film.crowd.visible=false; r.sceneNoCrowd=ms();
  // also no rain/fx
  film.rain.visible=false; film.fx.group.visible=false; r.sceneBare=ms();
  // actors off
  for(const [,a] of film.actors) a.root.visible=false; r.sceneEmpty=ms();
  // restore
  film.sky.visible=true; film.renderer.shadowMap.enabled=sh; film.rain.visible=true; film.fx.group.visible=true;
  for(const [id,a] of film.actors) a.root.visible = !!film.shot.cast[id];
  r.crowdCount = film.crowd.count;
  return r;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
