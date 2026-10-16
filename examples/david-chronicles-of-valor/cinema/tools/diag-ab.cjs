// A/B a single frame with a scene tweak (shadow on/off, sun target, etc.) and write both JPEGs.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');const FF='/home/user/.cache/ffmpeg';
let H=null;
function writePPM(file,w,h,rgba){const rgb=Buffer.allocUnsafe(w*h*3);
 for(let i=0,j=0;i<w*h;i++,j+=3){const k=i*4;rgb[j]=rgba[k];rgb[j+1]=rgba[k+1];rgb[j+2]=rgba[k+2];}
 fs.writeFileSync(file,Buffer.concat([Buffer.from(`P6\n${w} ${h}\n255\n`),rgb]));}
(async()=>{
 const frame=parseInt(process.argv[2]||'30',10), scale=process.argv[3]||'0.3';
 H=await launch({root:ROOT});
 await H.page.goto(H.url(`/tools/render.html?scale=${scale}&quality=0.5`),{waitUntil:'load',timeout:240000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const probe=await H.page.evaluate('window.__probe('+frame+')');
 console.log('probe', JSON.stringify(probe));
 const cases=[
  ['ashadow', ()=>{}],
  ['noshadow', ()=>{ window.__film.sun.castShadow=false; }],
];
 for(const [name,fn] of cases){
  await H.page.evaluate(`(()=>{ window.__case=${fn.toString()}; })()`);
  const b64=await H.page.evaluate(`(async()=>{
    const film=window.__film; film.sun.castShadow=true;
    (${fn.toString()})();
    film.warmTo(${Math.max(0,frame-3)},2); film.setFrame(${frame}); film.renderLean();
    return window.__readLean();
  })()`.replace('${fn.toString()}',''));
  const buf=Buffer.from(b64,'base64');
  const [w,h]=await H.page.evaluate('window.__leanSize()');
  const ppm=path.join(ROOT,`probe/ab_${name}.ppm`); writePPM(ppm,w,h,buf);
  execFileSync(FF,['-y','-loglevel','error','-i',ppm,'-q:v','3',path.join(ROOT,`probe/ab_${name}.jpg`)]);
  fs.unlinkSync(ppm);
  console.log('wrote',name);
 }
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,10).join('\n'));process.exit(1);});
