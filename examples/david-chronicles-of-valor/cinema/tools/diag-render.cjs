const fs=require('node:fs'),path=require('node:path');
const { launch } = require('./harness.cjs');
const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
  H=await launch({root:ROOT});
  await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=1'),{waitUntil:'load',timeout:120000});
  await H.page.waitForFunction('window.__status==="ready"||String(window.__status).startsWith("error")',{timeout:900000,polling:500});
  console.log('status',await H.page.evaluate('window.__status'));
  const out=await H.page.evaluate(`(()=>{
    const film=window.__film, r=film.renderer;
    const res=[r.domElement.width,r.domElement.height];
    const px=new Uint8Array(res[0]*res[1]*4);
    const gl=r.getContext();
    const mean=()=>{gl.readPixels(0,0,res[0],res[1],gl.RGBA,gl.UNSIGNED_BYTE,px);let s=0;for(let i=0;i<px.length;i+=4)s+=px[i]+px[i+1]+px[i+2];return +(s/(px.length/4)/3).toFixed(2);};
    film.setFrame(600);
    // 1) direct render (no post)
    film.camera.aspect=res[0]/res[1]; film.camera.updateProjectionMatrix();
    r.setRenderTarget(null); r.autoClear=true; r.render(film.scene, film.camera);
    const direct=mean();
    // 2) composer
    film.composer.render();
    const composer=mean();
    // 3) render target contents directly
    r.setRenderTarget(film.composer.renderTarget1); const rt1=mean();
    r.setRenderTarget(null);
    return {res, direct, composer, rt1, calls:r.info.render.calls, tris:r.info.render.triangles,
            visibleActors:[...film.actors].filter(([k,a])=>a.root.visible).map(([k,a])=>[k,a.root.position.toArray().map(v=>+v.toFixed(2)),a._t]),
            camPos:film.camera.position.toArray().map(v=>+v.toFixed(2)), camFov:film.camera.fov,
            titleVisible:film.title.visible, fade:film.fadeAmount};
  })()`);
  console.log(JSON.stringify(out,null,1));
  const b64=await H.page.evaluate('window.__grab(0.9)');
  fs.writeFileSync(path.join(ROOT,'probe/diag.jpg'),Buffer.from(b64,'base64'));
  await H.close();
})().catch(e=>{console.error('FAIL',e.message); if(H&&H.logs.length)console.error(H.logs.join('\n')); process.exit(1);});
