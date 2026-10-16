import {createCanvas} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {drawFrame,FRAMES,SHOTS,EVENTS} from './film.mjs';
import {fonts,out} from './render.mjs';
import {sourceHash} from './fingerprint.mjs';
fonts();mkdirSync(out,{recursive:true});
const width=480,height=270,canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
const frames=new Set([0,10716,10787,10788,10799]);
for(let f=0;f<FRAMES;f+=120)frames.add(f);
for(const shot of SHOTS)for(const offset of [0,90,150,210,299])frames.add(shot.start_frame+offset);
for(const e of EVENTS)for(const d of [-1,0,1])if(e.frame+d>=0&&e.frame+d<FRAMES)frames.add(e.frame+d);
const samples=[],failures=[];
const digest=f=>{drawFrame(ctx,f,width,height);return createHash('sha256').update(canvas.data()).digest('hex');};
const first=digest(732);digest(8460);const deterministic=first===digest(732);if(!deterministic)failures.push('Random-access determinism');
const sheet=createCanvas(1600,36/4*247),sc=sheet.getContext('2d');sc.fillStyle='#101719';sc.fillRect(0,0,sheet.width,sheet.height);
for(const [i,shot]of SHOTS.entries()){
 const thumb=createCanvas(400,225);drawFrame(thumb.getContext('2d'),shot.start_frame+150,400,225);const x=i%4*400,y=Math.floor(i/4)*247;sc.drawImage(thumb,x,y);sc.fillStyle='#D7C7A9';sc.font='12px Inter';sc.fillText(`${shot.id}  ${shot.start_frame/60}–${shot.end_frame_exclusive/60}s  ${shot.title}`,x+8,y+240);
}
writeFileSync(join(out,'contact-sheet.jpg'),sheet.toBuffer('image/jpeg',88));
for(const f of [...frames].sort((a,b)=>a-b)){
 const meta=drawFrame(ctx,f,width,height),data=canvas.data();let sum=0,squares=0,min=255,max=0,count=0;
 for(let y=20;y<250;y+=3)for(let x=10;x<470;x+=3){const i=(y*width+x)*4,v=(data[i]+data[i+1]+data[i+2])/3;sum+=v;squares+=v*v;min=Math.min(min,v);max=Math.max(max,v);count++;}
 const mean=sum/count,std=Math.sqrt(Math.max(0,squares/count-mean*mean));
 const finite=Object.values(meta.heroProjected).every(Number.isFinite)&&Number.isFinite(meta.faces);
 if(!finite)failures.push(`Non-finite projection ${f}`);
 if(f<10716&&(mean<10||std<7))failures.push(`Blank/flat sample ${f}: ${mean},${std}`);
 if(f>=10788&&max!==0)failures.push(`Final black not black ${f}`);
 if(meta.heroProjected.depth<=0)failures.push(`Hero behind camera ${f}`);
 samples.push({frame:f,mean,std,min,max,...meta});
 if(global.gc&&f%1200===0)global.gc();
}
const report={passed:failures.length===0,sourceHash:sourceHash(),deterministic,sampleResolution:[width,height],sampleCount:samples.length,failures,samples,scope:'Random-access low-resolution frame samples, all shot boundaries/midpoints, contact-event neighborhoods and final black. Not a full-resolution aesthetic or physical-contact certification.'};
writeFileSync(join(out,'qa-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,samples:report.sampleCount,deterministic,failures},null,2));if(!report.passed)process.exitCode=1;
