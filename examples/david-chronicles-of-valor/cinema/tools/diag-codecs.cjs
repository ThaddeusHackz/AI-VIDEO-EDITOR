const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.5&quality=1'),{waitUntil:'load',timeout:180000});
 await H.page.waitForFunction('window.__status==="ready"',{timeout:900000,polling:500});
 const out=await H.page.evaluate(`(async()=>{
  const res={hasVideoEncoder: typeof VideoEncoder!=='undefined', hasVideoFrame: typeof VideoFrame!=='undefined'};
  if(!res.hasVideoEncoder) return res;
  const configs=[
    {codec:'avc1.640028', width:3840,height:2160,bitrate:20_000_000,framerate:60, avc:{format:'annexb'}},
    {codec:'avc1.4d0028', width:3840,height:2160,bitrate:20_000_000,framerate:60, avc:{format:'annexb'}},
    {codec:'vp09.00.10.08', width:3840,height:2160,bitrate:20_000_000,framerate:60},
    {codec:'vp8', width:3840,height:2160,bitrate:20_000_000,framerate:60},
    {codec:'av01.0.08M.08', width:3840,height:2160,bitrate:20_000_000,framerate:60},
  ];
  res.support={};
  for(const c of configs){
    try{ const s=await VideoEncoder.isConfigSupported(c); res.support[c.codec]=s.supported; }catch(e){ res.support[c.codec]='err:'+e.message; }
  }
  return res;
})()`);
 console.log(JSON.stringify(out,null,1));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
