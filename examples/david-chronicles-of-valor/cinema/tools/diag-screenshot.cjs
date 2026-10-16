const fs=require('node:fs'),path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT,windowWidth:3840,windowHeight:2160});
 await H.page.setViewport({width:3840,height:2160,deviceScaleFactor:1});
 await H.page.goto(H.url('/tools/render.html?scale=1&quality=0.6'),{waitUntil:'load',timeout:240000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 // make sure the canvas is laid out at 4K in CSS pixels
 const layout=await H.page.evaluate(`(()=>{const c=window.__film.renderer.domElement;
   return {attr:[c.width,c.height],css:[c.clientWidth,c.clientHeight],dpr:devicePixelRatio,inner:[innerWidth,innerHeight]};})()`);
 console.log('layout',JSON.stringify(layout));
 const shoot=async(f,file)=>{
   const t0=Date.now();
   await H.page.evaluate(fr=>{window.__film.warmTo(fr,4);window.__film.setFrame(fr);window.__film.render();},f);
   const t1=Date.now();
   const buf=await H.page.screenshot({type:'jpeg',quality:92,captureBeyondViewport:true,optimizeForSpeed:true});
   const t2=Date.now();
   fs.writeFileSync(path.join(ROOT,'probe',file),buf);
   return {setupMs:t1-t0,screenshotMs:t2-t1,bytes:buf.length};
 };
 console.log('A',JSON.stringify(await shoot(600,'shotA.jpg')));
 console.log('B',JSON.stringify(await shoot(6000,'shotB.jpg')));
 console.log('C',JSON.stringify(await shoot(7800,'shotC.jpg')));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
