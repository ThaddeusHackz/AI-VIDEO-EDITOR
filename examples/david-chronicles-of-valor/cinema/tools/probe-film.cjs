// probe-film.cjs — QA through the master render path. Renders one frame per probe point
// (state warmed through the preceding frames), writes PPM, converts to JPEG and tiles a sheet.
//   node tools/probe-film.cjs "frame:label,frame:label" [scale] [cols]
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const { launch }=require('./harness.cjs');
const ROOT=path.resolve(__dirname,'..');
const FF=process.env.FFMPEG||'/home/user/.cache/ffmpeg';
const probes=(process.argv[2]||'600:probe').split(',').map(p=>{const [f,label]=p.split(':');return {f:parseInt(f,10),label:label||String(f)};});
const SCALE=process.argv[3]||'0.2';
const COLS=parseInt(process.argv[4]||'3',10);
let H=null;
function writePPM(file,w,h,rgba){                    // RGBA (top-down) -> PPM P6
  const rgb=Buffer.allocUnsafe(w*h*3);
  for(let i=0,j=0;i<w*h;i++,j+=3){const k=i*4;rgb[j]=rgba[k];rgb[j+1]=rgba[k+1];rgb[j+2]=rgba[k+2];}
  fs.writeFileSync(file,Buffer.concat([Buffer.from(`P6\n${w} ${h}\n255\n`),rgb]));
}
(async()=>{
  H=await launch({root:ROOT});
  const dir=path.join(ROOT,'probe');fs.mkdirSync(dir,{recursive:true});
  await H.page.goto(H.url(`/tools/render.html?scale=${SCALE}&quality=0.6`),{waitUntil:'load',timeout:240000});
  await H.page.waitForFunction('window.__status==="ready"||String(window.__status).startsWith("error")',{timeout:900000,polling:500});
  const st=await H.page.evaluate('window.__status'); if(st!=='ready') throw new Error(st);
  const [w,h]=await H.page.evaluate('window.__leanSize()');
  const files=[];
  for(const {f,label} of probes){
    const ppm=path.join(dir,`p_${label}.ppm`), jpg=path.join(dir,`p_${label}.jpg`);
    await H.page.evaluate(fr=>{window.__film.warmTo(fr,2);},Math.max(0,f-4));
    for(let i=0;i<5;i++) await H.page.evaluate(fr=>{window.__lean(fr);},Math.max(0,f-4)+i);
    const b64=await H.page.evaluate('window.__readLean()');
    writePPM(ppm,w,h,Buffer.from(b64,'base64'));
    execFileSync(FF,['-y','-loglevel','error','-i',ppm,'-q:v','3',jpg]);
    fs.unlinkSync(ppm);
    files.push(jpg);
    console.log('probe',label,'f',f,'t='+(f/60).toFixed(1)+'s',fs.statSync(jpg).size,'bytes');
  }
  const tw=560;
  execFileSync(FF,['-y','-loglevel','error',...files.flatMap(f=>['-i',f]),'-filter_complex',
    `${files.map((_,k)=>`[${k}]scale=${tw}:-2[b${k}]`).join(';')};${files.map((_,k)=>`[b${k}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_,k)=>`${(k%COLS)*tw}_${Math.floor(k/COLS)*Math.round(tw*9/16)}`).join('|')}[out]`,
    '-map','[out]',path.join(dir,'qa.jpg')]);
  console.log('sheet',path.join(dir,'qa.jpg'),fs.statSync(path.join(dir,'qa.jpg')).size);
  await H.close();
})().catch(e=>{console.error('FAIL',e.message);if(H&&H.logs&&H.logs.length)console.error(H.logs.slice(0,15).join('\n'));process.exit(1);});
