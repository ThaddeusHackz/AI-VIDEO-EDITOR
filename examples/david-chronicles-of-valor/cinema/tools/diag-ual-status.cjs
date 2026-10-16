const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/render.html?scale=0.2&quality=0.4'),{waitUntil:'load',timeout:300000});
 await H.page.waitForFunction('window.__status==="ready"||String(window.__status).startsWith("error")',{timeout:600000,polling:500});
 const st=await H.page.evaluate('window.__status');
 console.log('status:',st);
 const lib=await H.page.evaluate(`(()=>{ const l=window.__film&&window.__film.lib; if(!l) return null;
   const bad=[]; for(const [n,c] of l.clips) if(!c) bad.push([n, l.sources.get(n)]);
   return {clips:l.clips.size, bad, cc0:[...l.sources.entries()].filter(([k,v])=>/quaternius/.test(String(v))).map(([k])=>k)}; })()`);
 console.log(JSON.stringify(lib,null,1));
 if(H.logs.length) console.log('page logs:', H.logs.slice(0,8).join('\n'));
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,10).join('\n'));process.exit(1);});
