// Per-frame budget at the delivery resolution. Method: render N frames of a variant with no
// reads (so JS only submits), then ONE readback to wait for the queue, and time the whole span.
// A synchronous read is a pipeline flush, so this is the only honest way to measure here.
const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 const scale=process.argv[2]||'0.3334';
 H=await launch({root:ROOT});
 await H.page.goto(H.url(`/tools/render.html?scale=${scale}&quality=0.6`),{waitUntil:'load',timeout:240000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,r=film.renderer,T=window.__three;
  const rt=film.gradeRT,w=rt.width,h=rt.height,buf=new Uint8Array(w*h*4);
  const N=8, base=6000;
  const frames=[]; for(let i=0;i<N;i++) frames.push(base+i*7);
  film.warmTo(base,2);
  const time=(variant)=>{
    variant.on();
    const t0=performance.now();
    for(const f of frames){ film.setFrame(f); variant.render(); }
    r.readRenderTargetPixels(rt,0,0,w,h,buf);
    const ms=(performance.now()-t0)/N;
    variant.off();
    return +ms.toFixed(0);
  };
  const full={on:()=>{ if(!film.sky.visible){film.sky.visible=true;} },off:()=>{},render:()=>film.renderLean()};
  const variants={
    full: ()=>time(full),
  };
  const res={size:[w,h]};
  res.full = time(full);
  const skyOff={on:()=>{film.sky.visible=false;},off:()=>{film.sky.visible=true;},render:()=>film.renderLean()};
  res.noSky = time(skyOff);
  const rainOff={on:()=>{film.rain.visible=false;},off:()=>{film.rain.visible=true;},render:()=>film.renderLean()};
  res.noRain = time(rainOff);
  const crowdOff={on:()=>{film.crowd.visible=false;},off:()=>{film.crowd.visible=true;},render:()=>film.renderLean()};
  res.noCrowd = time(crowdOff);
  const terrOff={on:()=>{film.terrain.visible=false;},off:()=>{film.terrain.visible=true;},render:()=>film.renderLean()};
  res.noTerrain = time(terrOff);
  const cropsOff={on:()=>{film.crops.visible=false;},off:()=>{film.crops.visible=true;},render:()=>film.renderLean()};
  res.noCrops = time(cropsOff);
  const ruinOff={on:()=>{film.ruin.visible=false;},off:()=>{film.ruin.visible=true;},render:()=>film.renderLean()};
  res.noRuin = time(ruinOff);
  const fxOff={on:()=>{film.fx.group.visible=false;film.rays.visible=false;},off:()=>{film.fx.group.visible=true;film.rays.visible=true;},render:()=>film.renderLean()};
  res.noFx = time(fxOff);
  const actorHide=()=>{const s=[];for(const [id,a] of film.actors){s.push([a,a.root.visible]);a.root.visible=false;}return s;};
  const actorShow=(s)=>{for(const [a,v] of s)a.root.visible=v;};
  res.noActors = time({on:()=>{window.__sv=actorHide();},off:()=>{actorShow(window.__sv);},render:()=>film.renderLean()});
  const shadowOff={on:()=>{film.sun.castShadow=false;},off:()=>{film.sun.castShadow=true;},render:()=>film.renderLean()};
  res.noShadowPass = time(shadowOff);
  const noGrade={on:()=>{},off:()=>{},render:()=>{r.setRenderTarget(film.leanRT);r.clear();r.render(film.scene,film.camera);r.setRenderTarget(null);}};
  res.noGradePass = time(noGrade);
  const empty={on:()=>{const o=[];for(const c of film.scene.children){o.push([c,c.visible]);if(c!==film.camera)c.visible=false;}
    for(const [id,a] of film.actors)a.root.visible=false;
    film.sky.visible=false;},off:()=>{for(const [c,v] of window.__empty)c.visible=v;},render:()=>film.renderLean()};
  const time2=(variant)=>{variant.on();window.__empty=[];const t0=performance.now();
    for(const f of frames){film.setFrame(f);variant.render();}
    r.readRenderTargetPixels(rt,0,0,w,h,buf);const ms=(performance.now()-t0)/N;variant.off();return +ms.toFixed(0);};
  res.emptyScene = time2(empty);
  res.transparent = 0;
  return res;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
