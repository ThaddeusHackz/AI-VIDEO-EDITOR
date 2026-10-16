const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.25&quality=1'),{waitUntil:'load',timeout:120000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(()=>{
   const film=window.__film,T=window.__three;
   const a=film.actors.get('david');
   const info={};
   const arm=a.inner.getObjectByName('Armature');
   info.armature={scale:arm.scale.toArray(),wscale:arm.getWorldScale(new T.Vector3()).toArray().map(v=>+v.toFixed(4))};
   const hb=a.bone('mixamorigHips'), hd=a.bone('mixamorigHead');
   info.before={hipsLocal:hb.position.toArray().map(v=>+v.toFixed(4)),hipsWorld:hb.getWorldPosition(new T.Vector3()).toArray().map(v=>+v.toFixed(3)),
                headLocal:hd.position.toArray().map(v=>+v.toFixed(4)),headWorld:hd.getWorldPosition(new T.Vector3()).toArray().map(v=>+v.toFixed(3)),
                hipsParent:hb.parent.name,hipsParentScale:hb.parent.scale.toArray().map(v=>+v.toFixed(4))};
   film.setFrame(600); film.setFrame(601);
   info.after={hipsLocal:hb.position.toArray().map(v=>+v.toFixed(4)),hipsWorld:hb.getWorldPosition(new T.Vector3()).toArray().map(v=>+v.toFixed(3)),
               headWorld:hd.getWorldPosition(new T.Vector3()).toArray().map(v=>+v.toFixed(3))};
   const act=[...a.actions].map(([k,ac])=>({layer:k,clip:ac.getClip().name,time:+ac.time.toFixed(3),w:+ac.getEffectiveWeight().toFixed(2),enabled:ac.enabled,paused:ac.paused}));
   info.actions=act;
   const bind=a.actions.get('base');
   if(bind){const cl=bind.getClip();info.trackNames=cl.tracks.slice(0,6).map(t=>t.name);info.trackCount=cl.tracks.length;
     const hp=cl.tracks.find(t=>t.name==='mixamorigHips.position');
     if(hp) info.hipsTrackSamples=[...hp.values.slice(0,9)].map(v=>+v.toFixed(3));}
   // mixer binding test: does the clip actually resolve to the bones?
   const res=T.PropertyBinding.findNode(a.inner,'mixamorigHips');
   info.bindingFound=!!res;
   return info;
 })()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.join('\n'));process.exit(1);});
