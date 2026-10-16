const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=1&quality=1'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 console.log('res',JSON.stringify(await H.page.evaluate('window.__info')));
 const out=await H.page.evaluate(`(()=>{
   const film=window.__film, T=window.__three;
   // pick an expensive frame (storm + many particles + actors)
   const frames=[1200, 6000, 7800, 9000, 10500];
   const rows=[];
   for(const f of frames){
     film.warmTo(f,4);
     const t0=performance.now(); film.setFrame(f); const t1=performance.now();
     film.render(); const t2=performance.now();
     const j=film.renderer.domElement.toDataURL('image/jpeg',0.92); const t3=performance.now();
     rows.push({f, state:+(t1-t0).toFixed(0), render:+(t2-t1).toFixed(0), jpeg:+(t3-t2).toFixed(0), kb:Math.round(j.length*0.75/1024)});
   }
   return rows;
 })()`);
 let tot=0; for(const r of out){ console.log(JSON.stringify(r)); tot+=r.state+r.render+r.jpeg; }
 console.log('mean ms/frame @4K:', (tot/out.length).toFixed(0), '=> hours for 10800:', ((tot/out.length)*10800/3600000).toFixed(1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
