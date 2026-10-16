// sheet.cjs — render a list of frames at reduced scale and tile them into contact sheets.
//   node tools/sheet.cjs <framesCsv> [scale] [cols] [tag]
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const { launch }=require('./harness.cjs');
const ROOT=path.resolve(__dirname,'..');
const FF=process.env.FFMPEG||'/home/user/.cache/ffmpeg';
const frames=(process.argv[2]||'').split(',').filter(Boolean).map(Number);
const scale=process.argv[3]||'0.3';
const cols=parseInt(process.argv[4]||'3',10);
const tag=process.argv[5]||'sheet';
let H=null;
(async()=>{
  H=await launch({root:ROOT});
  const dir=path.join(ROOT,'probe');fs.mkdirSync(dir,{recursive:true});
  await H.page.goto(H.url(`/tools/render.html?scale=${scale}&quality=1`),{waitUntil:'load',timeout:120000});
  await H.page.waitForFunction('window.__status==="ready"||String(window.__status).startsWith("error")',{timeout:900000,polling:500});
  const st=await H.page.evaluate('window.__status'); if(st!=='ready') throw new Error(st);
  const files=[];
  for(const f of frames){
    const t0=Date.now();
    await H.page.evaluate(fr=>{window.__warm(fr,2);},f);
    const b64=await H.page.evaluate('window.__grab(0.88)');
    const file=path.join(dir,`f${String(f).padStart(5,'0')}.jpg`);
    fs.writeFileSync(file,Buffer.from(b64,'base64'));files.push(file);
    const s=await H.page.evaluate('window.__stats()');
    console.log(`f${f} t=${(f/60).toFixed(1)}s ${Date.now()-t0}ms shot=${s.shot.split(' ').slice(0,2).join(' ')} actors=${Object.keys(s.actors).length} storm=${s.weather.storm}`);
  }
  const rows=Math.ceil(files.length/cols);
  const args=files.flatMap(f=>['-i',f]);
  const w=520;
  const grid=files.map((_,k)=>`${(k%cols)*w}_${Math.floor(k/cols)*Math.round(w*9/16)}`).join('|');
  execFileSync(FF,['-y','-loglevel','error',...args,'-filter_complex',
    `${files.map((_,k)=>`[${k}]scale=${w}:-1[b${k}]`).join(';')};${files.map((_,k)=>`[b${k}]`).join('')}xstack=inputs=${files.length}:layout=${grid}[out]`,
    '-map','[out]',path.join(dir,`${tag}.jpg`)]);
  console.log('sheet:',path.join(dir,`${tag}.jpg`),fs.statSync(path.join(dir,`${tag}.jpg`)).size);
  await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs.length)console.error(H.logs.slice(0,20).join('\n'));process.exit(1);});
