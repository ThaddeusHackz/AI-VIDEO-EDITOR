const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=1&quality=0.4'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film,T=window.__three,gl=film.renderer.getContext();
  const sizes=[[960,540],[1280,720],[1600,900],[1920,1080]];
  const r=[];
  for(const [w,h] of sizes){
    film.renderer.setSize(w,h,false);
    const buf=new Uint8Array(w*h*4);
    const times=[];
    for(let i=0;i<6;i++){
      film.setFrame(6000+i);
      const t=performance.now();
      film.render();
      gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);
      times.push(+(performance.now()-t).toFixed(0));
    }
    times.sort((a,b)=>a-b);
    r.push({size:w+'x'+h, median:times[3], min:times[0], max:times[5], all:times});
  }
  return r;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
