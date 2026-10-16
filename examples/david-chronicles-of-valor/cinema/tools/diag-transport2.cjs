const fs=require('node:fs'),path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT,windowWidth:3860,windowHeight:2180});
 await H.page.goto(H.url('/tools/render.html?scale=1&quality=1'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 // (1) CDP screenshot of the 4K canvas
 await H.page.evaluate('window.__film.warmTo(6000,4)');
 let t0=Date.now();
 let shot=await H.page.screenshot({type:'jpeg',quality:92,captureBeyondViewport:false,optimizeForSpeed:true});
 console.log('CDP screenshot 4K ms:',Date.now()-t0,'bytes:',shot.length);
 fs.writeFileSync(path.join(ROOT,'probe/cdp.jpg'),shot);
 // (2) OffscreenCanvas convertToBlob
 const ocb=await H.page.evaluate(`(async()=>{
   const film=window.__film; const c=film.renderer.domElement;
   const oc=new OffscreenCanvas(c.width,c.height); const g=oc.getContext('2d');
   film.setFrame(6001); film.render();
   const t0=performance.now();
   g.drawImage(c,0,0);
   const t1=performance.now();
   const blob=await oc.convertToBlob({type:'image/jpeg',quality:0.92});
   const t2=performance.now();
   const ab=await blob.arrayBuffer();
   const t3=performance.now();
   return {drawMs:+(t1-t0).toFixed(0),encodeMs:+(t2-t1).toFixed(0),readMs:+(t3-t2).toFixed(0),bytes:ab.byteLength};
 })()`);
 console.log('offscreen:',JSON.stringify(ocb));
 // (3) readPixels at reduced canvas size
 const rp=await H.page.evaluate(`(()=>{
   const film=window.__film; const r=film.renderer;
   film.setFrame(6002); film.render();
   const gl=r.getContext();
   const out={};
   for (const [w,h] of [[1920,1080],[960,540]]) {
     const buf=new Uint8Array(w*h*4);
     const t0=performance.now();
     gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);
     out[w+'x'+h]=+(performance.now()-t0).toFixed(0);
   }
   return out;
 })()`);
 console.log('readPixels sub-rect ms:',JSON.stringify(rp));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
