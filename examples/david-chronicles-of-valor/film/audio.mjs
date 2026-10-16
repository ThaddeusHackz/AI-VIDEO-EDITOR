// Original deterministic synthesized score and foley. No sampled commercial music.
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import PLAN from './plan.json' with {type:'json'};
import {rng,clamp,smooth} from './geometry.mjs';
export const SAMPLE_RATE=48000,SAMPLES=8640000;
const TAU=Math.PI*2,ROOT=dirname(fileURLToPath(import.meta.url));
export function synthesize(){
 const L=new Float32Array(SAMPLES),R=new Float32Array(SAMPLES),random=rng(509173);
 const put=(i,v,pan)=>{if(i>=0&&i<SAMPLES){L[i]+=v*Math.sqrt((1-pan)/2);R[i]+=v*Math.sqrt((1+pan)/2);}};
 const note=(start,duration,midi,amp,kind='string',pan=0)=>{
  const begin=Math.round(start*SAMPLE_RATE),count=Math.round(duration*SAMPLE_RATE),f=440*2**((midi-69)/12);
  for(let k=0;k<count;k++){
   const t=k/SAMPLE_RATE,attack=kind==='pluck'?.008:kind==='horn'?.25:.6,release=kind==='pluck'?.16:.7;
   const env=clamp(t/attack)*clamp((duration-t)/Math.min(release,duration*.45));
   const phase=TAU*f*t+.012*Math.sin(TAU*4.8*t);
   let value;
   if(kind==='pluck')value=(Math.sin(phase)+.36*Math.sin(phase*2)+.18*Math.sin(phase*3))*Math.exp(-t*4.5);
   else if(kind==='horn')value=Math.sin(phase)+.25*Math.sin(phase*2)+.14*Math.sin(phase*3)+.07*Math.sin(phase*4);
   else value=(Math.sin(phase)+.36*Math.sin(phase*2+.03)+.18*Math.sin(phase*3)+.12*Math.sin(phase*1.0027))/1.4;
   put(begin+k,value*amp*env,pan);
  }
 };
 const drum=(start,amp,pan=0,low=true)=>{
  const begin=Math.round(start*SAMPLE_RATE),duration=low?.85:.24;let phase=0,lp=0;
  for(let k=0;k<duration*SAMPLE_RATE;k++){
   const t=k/SAMPLE_RATE;phase+=TAU*(low?48+45*Math.exp(-t*22):115+80*Math.exp(-t*35))/SAMPLE_RATE;
   lp=.8*lp+.2*(random()*2-1);
   const v=Math.sin(phase)*Math.exp(-t*(low?5:17))+.35*lp*Math.exp(-t*28);
   put(begin+k,amp*v*clamp(t/.002),pan);
  }
 };
 const metal=(start,amp,pan)=>{
  const begin=Math.round(start*SAMPLE_RATE);
  for(let k=0;k<.9*SAMPLE_RATE;k++){
   const t=k/SAMPLE_RATE,v=(Math.sin(TAU*1439*t)+.55*Math.sin(TAU*2393*t)+.24*Math.sin(TAU*3831*t))*Math.exp(-t*14)+(random()*2-1)*.3*Math.exp(-t*65);
   put(begin+k,amp*v*clamp(t/.001),pan);
  }
 };
 const swish=(start,duration,amp,pan)=>{let lp=0;const begin=Math.round(start*SAMPLE_RATE);for(let k=0;k<duration*SAMPLE_RATE;k++){const t=k/SAMPLE_RATE,u=t/duration;lp=.55*lp+.45*(random()*2-1);put(begin+k,lp*amp*Math.sin(Math.PI*u)**2,pan);}};
 // D minor / Dorian: a newly composed eight-note motif, transformed at each act.
 const sections=[{a:0,b:30,bpm:72,density:0},{a:30,b:70,bpm:96,density:1},{a:70,b:110,bpm:104,density:1},{a:110,b:140,bpm:96,density:2},{a:140,b:155,bpm:64,density:0},{a:155,b:175,bpm:76,density:1}];
 const chords=[[38,45,50,53],[34,41,46,50],[36,43,48,52],[38,45,50,57]],motif=[62,69,72,74,77,76,74,69];
 for(const section of sections){
  const beat=60/section.bpm,bar=beat*4;
  for(let start=section.a,barIndex=0;start<section.b;start+=bar,barIndex++){
   const remaining=section.b-start,chord=chords[barIndex%4];
   chord.forEach((m,i)=>note(start,Math.min(bar+.35,remaining+.3),m,.025+(i===0?.014:0),'string',(i-1.5)*.38));
   if(section.a>=155){note(start,Math.min(bar,remaining),62+([0,5,7,2][barIndex%4]),.045,'horn',-.14);}
   for(let j=0;j<4;j++){
    const time=start+j*beat;if(time>=section.b)break;
    const slowAir=time>=75&&time<85,climax=time>=140&&time<150;
    if(!slowAir&&!climax&&(j===0||section.density>0))drum(time,j===0?.17:.085,j%2?.3:-.2,j%2===0);
    if(section.density>0&&!slowAir&&!climax){note(time,Math.min(beat*.9,.7),chord[j%4]+12,.065,'pluck',j%2?.35:-.35);if(section.density===2)drum(time+beat/2,.035,.5,false);}
   }
   if(barIndex%2===0&&section.a>=30&&section.a<140){
    for(let j=0;j<4;j++){const time=start+j*beat*.75;if(time<section.b)note(time,beat*1.4,motif[(barIndex*2+j)%8],.027,'horn',(j%2?1:-1)*.22);}
   }
  }
 }
 // Suspended air, low storm pedal, then a genuinely major final resolution.
 for(const [start,dur,notes,amp] of [[75,10,[50,57,64,69],.024],[140,14,[38,45,50,60],.035],[165,10,[38,45,54,57,62],.029],[175,4.6,[38,45,50,54,57,62,69],.035]])notes.forEach((m,i)=>note(start,dur,m,amp,'string',(i%3-1)*.5));
 drum(175,.22);note(175,3.8,62,.055,'horn',0);
 // Contact transients follow the blueprint's sample-exact event grid.
 for(const [i,e] of PLAN.events.entries()){
  const time=e.frame/60;if(e.kind!=='contact')continue;
  const n=Number(e.shot.slice(1)),pan=i%2?.27:-.27;
  swish(time-.22,.22,.15,pan);drum(time,n===18||n===31?.29:.14,pan);
  if(![4,6,18,19,20].includes(n))metal(time,[14,31].includes(n)?.12:.065,pan);
  if([14,31].includes(n))for(let j=0;j<5;j++)metal(time+.05+j*.055,.018,(j-2)*.2);
 }
 for(let time=70;time<74.8;time+=Math.PI/8)drum(time,.042,Math.sin(time)*.4,false);
 swish(77.8,.5,.16,.6);metal(78.16,.08,.65);swish(81,.45,.13,-.7);
 for(const start of [118.5,125.5]){
  let low=0;for(let k=0;k<5*SAMPLE_RATE;k++){const t=k/SAMPLE_RATE;low=.995*low+.005*(random()*2-1);put(Math.round(start*SAMPLE_RATE)+k,low*1.9*Math.exp(-t*.7)*clamp(t/.08),-.15);}
 }
 // Continuous wind, fine rain and quiet human breath in the opening close-up.
 let wind=0,rainL=0,rainR=0;
 for(let i=0;i<SAMPLES;i++){
  const t=i/SAMPLE_RATE,n=random()*2-1;wind=.998*wind+.002*n;
  const wet=smooth((t-110)/15)*(1-smooth((t-165)/10)*.8);
  rainL=.30*rainL+.70*n;rainR=.3*rainR+.7*(random()*2-1);
  L[i]+=wind*(.14+wet*.18)+rainL*wet*.012;R[i]+=wind*(.13+wet*.19)+rainR*wet*.012;
  if(t<10){const breath=(.5+.5*Math.sin(t*2.2))**3;L[i]+=rainL*breath*.008;R[i]+=rainR*breath*.008;}
 }
 // Two small cross-channel room delays; no circular buffer or live-clock state.
 for(const [seconds,gain]of [[.073,.09],[.119,.065]]){const delay=Math.round(seconds*SAMPLE_RATE);for(let i=SAMPLES-1;i>=delay;i--){L[i]+=R[i-delay]*gain;R[i]+=L[i-delay]*gain;}}
 let peak=0,sum=0;for(let i=0;i<SAMPLES;i++){const fade=smooth(i/SAMPLE_RATE/.2)*(1-smooth((i/SAMPLE_RATE-178)/1.75));L[i]*=fade;R[i]*=fade;peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));}
 const gain=.88/peak,buffer=Buffer.alloc(44+SAMPLES*4);
 buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(2,22);buffer.writeUInt32LE(SAMPLE_RATE,24);buffer.writeUInt32LE(SAMPLE_RATE*4,28);buffer.writeUInt16LE(4,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(SAMPLES*4,40);
 for(let i=0;i<SAMPLES;i++){const l=L[i]*gain,r=R[i]*gain;buffer.writeInt16LE(Math.round(l*32767),44+i*4);buffer.writeInt16LE(Math.round(r*32767),46+i*4);sum+=l*l+r*r;}
 const out=join(ROOT,'out');mkdirSync(out,{recursive:true});writeFileSync(join(out,'score.wav'),buffer);
 const report={sampleRate:SAMPLE_RATE,channels:2,frames:SAMPLES,duration:180,peak:.88,peakDbfs:20*Math.log10(.88),rmsDbfs:20*Math.log10(Math.sqrt(sum/(2*SAMPLES))),seed:509173,provenance:'Original deterministic subtractive/additive synthesis; no external music or voice recordings.'};
 writeFileSync(join(out,'audio-report.json'),JSON.stringify(report,null,2));console.log(report);return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url))synthesize();
