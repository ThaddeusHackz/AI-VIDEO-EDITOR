import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {drawFrame,WIDTH,HEIGHT,FPS,FRAMES} from './film.mjs';
import {synthesize} from './audio.mjs';
import {sourceHash} from './fingerprint.mjs';
import {ffmpegPath} from './encoder.mjs';
export const here=dirname(fileURLToPath(import.meta.url));
export const out=join(here,'out');
export function fonts(){
  for(const [file,family] of [['cinzel-700','Cinzel'],['inter-400','Inter'],['cormorant-700','Serif'],['mono-400','Mono']]){
    if(!GlobalFonts.registerFromPath(join(here,'fonts',file+'.woff2'),family))throw new Error(`Could not load font ${file}`);
  }
}
export function renderStill(frame,width=1920,height=1080){
  fonts();const canvas=createCanvas(width,height);drawFrame(canvas.getContext('2d'),frame,width,height);return canvas;
}
function checkedFFmpeg(){
  const executable=ffmpegPath();
  const result=spawnSync(executable,['-hide_banner','-demuxers'],{encoding:'utf8'});
  if(!result.stdout?.includes('rawvideo'))throw new Error('A full FFmpeg with rawvideo demuxing is required. Install requirements-render.txt into .venv, or set FFMPEG.');
  return executable;
}
function run(executable,args){
  return new Promise((resolve,reject)=>{
    const child=spawn(executable,args,{stdio:'inherit'});
    child.once('error',reject);
    child.once('close',code=>code===0?resolve():reject(new Error(`${executable} exited ${code}`)));
  });
}
async function chunk(start,end,draft){
  const width=draft?1920:WIDTH,height=draft?1080:HEIGHT;
  fonts();const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
  const folder=join(out,draft?'chunks-hd':'chunks-4k');mkdirSync(folder,{recursive:true});
  const path=join(folder,`${String(start).padStart(5,'0')}.mp4`);
  const args=['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${height}`,'-framerate',String(FPS),'-i','pipe:0',
    '-an','-c:v','libx264','-preset','veryfast','-crf','21','-maxrate',draft?'3M':'4M','-bufsize',draft?'6M':'8M','-pix_fmt','yuv420p','-profile:v','high','-level:v',draft?'4.2':'5.2',
    '-threads','2','-filter_threads','1','-x264-params','rc-lookahead=8:ref=2','-g','120','-keyint_min','30','-frames:v',String(end-start),'-video_track_timescale','60000',path];
  const ff=spawn(checkedFFmpeg(),args,{stdio:['pipe','ignore','pipe']});
  let errors='',pipeError=null;ff.stderr.on('data',d=>{errors+=d;});ff.stdin.on('error',e=>{pipeError=e;});
  const done=new Promise((resolve,reject)=>{ff.once('error',reject);ff.once('close',code=>code===0?resolve():reject(new Error(`Encoder ${code}: ${errors}`)));});
  done.catch(()=>{});
  try{
    for(let f=start;f<end;f++){
      if(pipeError)throw pipeError;
      drawFrame(ctx,f,width,height);
      if(!ff.stdin.write(canvas.data()))await once(ff.stdin,'drain');
      if(f%30===0&&global.gc)global.gc();
    }
    ff.stdin.end();await done;
  }catch(error){
    ff.stdin.destroy();ff.kill('SIGTERM');await done.catch(()=>{});
    throw new Error(`${error.message}\n${errors}`);
  }
  // A manifest is written only after the encoder has closed successfully.
  writeFileSync(path+'.json',JSON.stringify({start,end,width,height,hash:sourceHash(),encoding:'h264-veryfast-crf21-vbv4-v1'}));
}
async function film(){
  const draft=process.argv.includes('--draft');mkdirSync(out,{recursive:true});
  const qaPath=join(out,'qa-report.json');
  if(!existsSync(qaPath))throw new Error('Run npm run qa before export.');
  const qa=JSON.parse(readFileSync(qaPath,'utf8'));
  if(!qa.passed||qa.sourceHash!==sourceHash())throw new Error('QA failed or source changed. Re-run npm run qa.');
  synthesize();
  const executable=checkedFFmpeg(),folder=join(out,draft?'chunks-hd':'chunks-4k');mkdirSync(folder,{recursive:true});
  const paths=[],startTime=Date.now(); // render instrumentation only, not animation state
  // Restart native Skia/encoder processes every five seconds. This bounds both
  // native-library caches and lookahead memory on small (4 GB) render workers.
  for(let start=0;start<FRAMES;start+=300){
    const end=Math.min(start+300,FRAMES),path=join(folder,`${String(start).padStart(5,'0')}.mp4`);
    let cached=false;
    if(existsSync(path)&&existsSync(path+'.json')){
      const m=JSON.parse(readFileSync(path+'.json','utf8'));
      cached=m.hash===sourceHash()&&m.start===start&&m.end===end&&m.encoding==='h264-veryfast-crf21-vbv4-v1';
    }
    if(!cached)await run(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'chunk',String(start),String(end),...(draft?['--draft']:[])]);
    paths.push(path);console.log(`${cached?'Reused':'Rendered'} frames ${start}–${end-1} | ${end}/${FRAMES} | ${((Date.now()-startTime)/1000).toFixed(1)}s`);
  }
  const list=join(folder,'concat.txt');writeFileSync(list,paths.map(p=>`file '${p.replaceAll("'","'\\''")}'`).join('\n'));
  const target=join(out,draft?'david-preview.mp4':'david-chronicles-of-valor-stylized-4k60.mp4');
  await run(executable,['-y','-hide_banner','-loglevel','warning','-f','concat','-safe','0','-i',list,'-i',join(out,'score.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-frames:v',String(FRAMES),'-t','180','-video_track_timescale','60000','-movflags','+faststart','-metadata','title=David: The Chronicles of Valor — Stylized 3D','-metadata','comment=User-approved stylized CPU-rendered 3D film; 10800 frames; original procedural score. Not Unreal, photorealistic, MetaHuman or motion capture.',target]);
  console.log(`Finished ${target}`);
}
async function main(){
  mkdirSync(out,{recursive:true});
  if(process.argv[2]==='film')return film();
  if(process.argv[2]==='chunk'){
    const start=Number(process.argv[3]),end=Number(process.argv[4]);
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>FRAMES||end<=start)throw new Error('Invalid chunk range');
    return chunk(start,end,process.argv.includes('--draft'));
  }
  if(process.argv[2]==='stills'){
    const frames=process.argv.slice(3).map(Number);
    for(const frame of frames.length?frames:Array.from({length:36},(_,i)=>i*300+150)){
      const canvas=renderStill(frame);writeFileSync(join(out,`frame-${String(frame).padStart(5,'0')}.png`),canvas.toBuffer('image/png'));console.log(`Still ${frame}`);
    }
  }else throw new Error('Usage: node render.mjs stills [frames...] | film [--draft]');
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
