const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.2&quality=0.4'),{waitUntil:'load',timeout:240000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
  const film=window.__film;
  const rows=[];
  for(const f of [0,30,60,120,300,540]){
    film.warmTo(Math.max(0,f-3),2); film.setFrame(f);
    const c=film.camera;
    const w=film.weather||{};
    rows.push({f, shot:film.shot&&film.shot.id, cam:[+c.position.x.toFixed(2),+c.position.y.toFixed(2),+c.position.z.toFixed(2)],
      look:film.shot?null:null, fov:+c.fov.toFixed(1), fade:+(film.fadeAmount||0).toFixed(3),
      terrain:[+window.__terrainY(c.position.x,c.position.z).toFixed(2)],
      david:(()=>{const a=film.actors.get('david');return a?[+a.root.position.x.toFixed(2),+a.root.position.y.toFixed(2),+a.root.position.z.toFixed(2),a.root.visible]:null;})(),
      sun:[+film.sun.position.x.toFixed(1),+film.sun.position.y.toFixed(1),+film.sun.position.z.toFixed(1)],
      sunI:+film.sun.intensity.toFixed(2), env:+film.scene.environmentIntensity.toFixed(2)});
  }
  return rows;
 })()`);
 for(const r of out) console.log(JSON.stringify(r));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,10).join('\n'));process.exit(1);});
