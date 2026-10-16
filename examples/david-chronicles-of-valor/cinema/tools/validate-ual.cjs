const path=require('node:path');const { launch }=require('./harness.cjs');const ROOT=path.resolve(__dirname,'..');
let H=null;
(async()=>{
 H=await launch({root:ROOT});
 await H.page.goto(H.url('/tools/validate-ual.html'),{waitUntil:'load',timeout:240000});
 await H.page.waitForFunction('window.__status!=="loading"',{timeout:600000,polling:500});
 const st=await H.page.evaluate('window.__status');
 if(st!=='ready'){console.error('status:',st);if(H.logs.length)console.error(H.logs.slice(0,10).join('\n'));process.exit(1);}
 const info=await H.page.evaluate('window.__info');
 console.log('character bones:',info.charBones,'| alias entries:',info.aliasEntries);
 console.log('sample bone names:',info.charSample.join(', '));
 console.log('clips ok:',info.okCount,'failed:',info.failCount,'| missing files:',info.missing.join(',')||'none');
 for(const r of info.clips){
   if(r.ok) console.log(`  OK   ${r.name.padEnd(18)} dur=${String(r.duration).padStart(5)}s bound=${String(r.bound).padStart(3)} hipsY=[${r.hipsY}] ${JSON.stringify(r.sample)}`);
   else console.log(`  FAIL ${r.name.padEnd(18)} ${r.error||('bound='+r.bound+' hipsY='+JSON.stringify(r.hipsY))} missing=${JSON.stringify(r.missing)}`);
 }
 require('node:fs').writeFileSync(path.join(ROOT,'out','ual-validation.json'), JSON.stringify(info,null,1)+'\n');
 await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,12).join('\n'));process.exit(1);});
