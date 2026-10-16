import PLAN from './plan.json' with {type:'json'};
import {Scene3D,V,add,sub,mul,norm,cross,length,mix,lerp,clamp,smooth,spring,pulse,rng,rgb,css,colorMix,transform} from './geometry.mjs';
import {actor,poseFor,soldierLOD,blade} from './actors.mjs';
export const FPS=60,FRAMES=10800,DURATION=180,WIDTH=3840,HEIGHT=2160;
export const SHOTS=PLAN.shots,EVENTS=PLAN.events;
const TAU=Math.PI*2;
const random=rng(731045);
const grains=Array.from({length:220},()=>({x:random(),y:random(),z:random(),v:random()}));
const stones=Array.from({length:75},()=>({x:(random()-.5)*24,z:-random()*20,y:random()*.15,s:.08+random()*.3,a:random()*TAU}));
const rain=Array.from({length:230},()=>({x:random(),y:random(),z:random(),speed:.6+random()}));
function keyLerp(keys,t){if(t<=keys[0][0])return keys[0].slice(1);for(let i=1;i<keys.length;i++)if(t<keys[i][0]){const a=keys[i-1],b=keys[i],p=smooth((t-a[0])/(b[0]-a[0]));return a.slice(1).map((v,j)=>mix(v,b[j+1],p));}return keys.at(-1).slice(1);}
export function environment(t){const v=keyLerp(PLAN.lightKeys,t),storm=clamp((100000-v[0])/96000),sunset=clamp((t-163)/12);return {storm:smooth(clamp((t-110)/14))*(1-smooth(clamp((t-163)/15))*.7),wet:v[5],rain:v[4]/40,wind:v[7],sunset,fogColor:colorMix(colorMix(rgb('#B9A586'),rgb('#53656A'),storm),rgb('#BFA480'),sunset*.6),light:norm([-0.6+sunset*.6,.85,.3])};}
function text(ctx,s,x,y,size,color,font='Inter',align='left'){ctx.font=`${size}px "${font}"`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;ctx.fillText(s,x,y);}
// Each shot has a purposeful composition; no text-slide or still-image substitution.
const CAM=[
 [[.02,1.69,.47],[.035,1.68,.55],[0,1.68,.12],[0,1.68,.12],30,32],
 [[.15,1.65,1.0],[.55,1.2,5.4],[0,1.44,0],[.2,1.1,0],38,43],
 [[.5,1.3,4.4],[1.3,1.25,4.0],[.25,1.0,0],[.35,1.05,0],44,42],
 [[.6,1.8,5.2],[1.7,1.9,5.6],[.1,1.5,0],[.3,1.55,0],46,46],
 [[.6,1.2,3.9],[1.5,1.3,4.3],[.1,1.1,0],[.4,1.05,0],44,46],
 [[.2,1.5,4.7],[2.0,1.1,5.0],[.3,.9,0],[.5,1.0,0],46,44],
 [[3.0,2.4,8.5],[2.4,2.2,7.5],[2.2,1,-2],[2.8,1,-2.0],57,54],
 [[.0,1.8,5.0],[2.6,1.6,4.6],[.1,1.2,0],[.2,1.2,0],45,47],
 [[.2,1.45,5.2],[1.8,1.4,5],[.3,1.1,0],[.5,1.0,0],46,44],
 [[.7,1.3,2.6],[.5,1.4,3.3],[-.1,1.25,.1],[.1,1.2,0],40,42],
 [[.5,1.65,4.6],[1.8,1.45,4.5],[.3,1.15,0],[.45,1.1,0],43,43],
 [[.9,1.4,4.8],[2.0,1.6,4.9],[.3,1.15,0],[.5,1.1,0],44,46],
 [[-.2,.8,4.2],[.8,1.0,4.0],[.1,1.10,0],[.2,1.15,0],46,44],
 [[.5,1.2,5.4],[1.7,1.1,5.1],[.3,1.1,0],[.6,1.1,0],45,45],
 [[-.8,1.5,6.5],[1.8,2.1,6.1],[.0,1.3,0],[.6,1.8,0],48,45],
 [[1.5,2.5,5.1],[2.6,2.7,4.9],[0,2.7,0],[.3,2.8,0],43,45],
 [[2.1,2.1,5.1],[1.2,1.8,5.5],[.1,2.1,0],[.4,1.25,0],45,45],
 [[.4,1.3,5.4],[1.2,.85,4.4],[.1,.8,0],[.2,.9,0],48,45],
 [[.3,1.5,4.8],[1.4,1.4,4.3],[.4,1,0],[.5,1.0,0],43,43],
 [[.6,1.5,4.2],[1.9,1.45,4.4],[.35,1.05,0],[.5,1.1,0],43,45],
 [[.5,1.7,4.5],[1.1,1.3,4.6],[.3,1.3,0],[.3,1.0,0],43,44],
 [[.5,1.6,5.2],[2.6,1.6,5.4],[.4,1.2,0],[.8,1.2,0],46,48],
 [[1.0,1.6,6.6],[2.5,2.7,7.3],[.2,1.0,0],[.2,1.2,-1],48,50],
 [[.0,1.5,2.3],[.8,1.3,2.6],[.0,1.3,.1],[.3,1.35,.0],36,40],
 [[-1.7,1.65,4.1],[-1.2,1.7,4.5],[.35,1.1,0],[.55,1.25,0],45,44],
 [[-1.6,1.7,3.6],[-1.2,1.65,3.9],[.45,1.3,0],[.6,1.3,0],42,42],
 [[-1.0,1.4,4.1],[-.6,1.5,3.9],[.45,1.2,0],[.55,1.2,0],42,42],
 [[-.8,1.6,3.8],[-.3,1.55,3.4],[.40,1.25,0],[.5,1.3,0],43,40],
 [[.3,1.6,4.6],[.7,1.55,4.4],[.4,1.4,0],[.5,1.4,0],46,44],
 [[.6,.9,3.8],[1.1,.70,3.9],[.4,.9,0],[.6,.85,0],43,43],
 [[.1,1.2,4.0],[1.5,1.6,4.8],[.4,1.25,0],[.5,1.3,0],43,44],
 [[.2,.35,6.2],[1.2,2.6,7.2],[0,.8,0],[0,1.1,0],48,46],
 [[1.2,2.6,7.2],[2.0,3.4,9.0],[0,1.1,0],[0,1.0,0],46,48],
 [[2.0,3.0,7.6],[2.8,3.8,10],[0,1.0,0],[0,.9,0],46,45],
 [[2.8,3.8,10],[5.2,5.0,16],[0,.9,0],[0,.6,-1.4],45,48],
 [[5.2,5.0,16],[6.0,5.5,18],[0,.6,-1.4],[0,.6,-1.5],48,48]
];
export function cameraAt(frame){const index=Math.floor(frame/300),lf=frame%300,t=lf/60,cam=CAM[index];const p=spring(t,1.05,1)/spring(299/60,1.05,1);const pos=lerp(cam[0],cam[1],p),target=lerp(cam[2],cam[3],p);if(index===15){const q=smooth((t-2.2)/1.2);pos.forEach((v,i)=>pos[i]=mix(v,[3.2,2.2,4.8][i],q));target.forEach((v,i)=>target[i]=mix(v,[3.5,1.65,-1.15][i],q));}for(const h of SHOTS[index].impacts){const a=t-h/60;if(a>=0&&a<.35){pos[1]+=.018*Math.exp(-a*12)*Math.sin(a*65);pos[0]+=.015*Math.exp(-a*12)*Math.sin(a*49);}}return{pos,target,filmGate:index===0?960:index===1?mix(960,720,p):720,fov:mix(cam[4],cam[5],p)};}
function backdrop(ctx,env,t){
 const top=colorMix(rgb('#68777A'),rgb('#223541'),env.storm),bottom=colorMix(rgb('#C9B08A'),rgb('#78888B'),env.storm);
 const g=ctx.createLinearGradient(0,50,0,850);g.addColorStop(0,css(colorMix(top,rgb('#8A7C69'),env.sunset)));g.addColorStop(.7,css(colorMix(bottom,rgb('#E0C492'),env.sunset)));g.addColorStop(1,css(bottom));ctx.fillStyle=g;ctx.fillRect(0,0,1920,1080);
 // Layered wind-shaped cloud banks. All noise is seeded once; no frame-wise sparkle.
 for(let j=0;j<9;j++){
  const x=(j*337+t*(2+env.storm*5))%2500-250,y=120+(j%3)*75;
  ctx.fillStyle=`rgba(27,42,49,${.025+env.storm*.06})`;ctx.beginPath();ctx.ellipse(x,y,340,40+j%3*12,-.05,0,TAU);ctx.fill();
 }
 if(env.sunset>.05||env.storm<.4){
  const strength=(1-env.storm)*.08+env.sunset*.12;
  for(let i=0;i<6;i++){ctx.fillStyle=`rgba(249,221,156,${strength*(.35+i*.04)})`;ctx.beginPath();ctx.moveTo(1420+i*36,80);ctx.lineTo(430+i*155,1040);ctx.lineTo(660+i*151,1040);ctx.closePath();ctx.fill();}
 }
 const lightning=[116,123].reduce((s,h)=>s+pulse(t,h,.045),0);if(lightning>.001){ctx.fillStyle=`rgba(192,215,225,${lightning*.24})`;ctx.fillRect(0,0,1920,1080);}
}
function environmentMesh(scene,t,n){
 // True 3D terrain patches and distant faceted escarpments, not a photographic matte.
 for(let j=0;j<3;j++){
  const z=-20-j*16;
  for(let i=-10;i<10;i++){
   const x=i*7,h=3.2+1.4*Math.sin(i*.4+j)+.45*Math.sin(i*1.1)+j*.6,h2=3.2+1.4*Math.sin((i+1)*.4+j)+.45*Math.sin((i+1)*1.1)+j*.6;
   const a=[x,0,z+5],b=[x+7,0,z+5],c=[x+7,h2,z-3],d=[x,h,z-3];
   scene.face([a,b,c],j===0?'#938571':j===1?'#A39A85':'#B0A58F');
   scene.face([a,c,d],j===0?'#887D68':j===1?'#9A927D':'#ADA28C');
  }
 }
 for(let z=-22;z<8;z+=3)for(let x=-22;x<23;x+=3){
  const colors=scene.env.wet>.25?['#746F58','#726E57','#76705A','#756F59']:['#9D8968','#9F8A69','#9B8867','#9E8A6A'];
  const i=Math.abs(Math.floor(x*7+z*13))%colors.length;
  scene.face([[x,0,z],[x+3,0,z],[x+3,0,z+3],[x,0,z+3]],colors[i],{edge:.6});
 }
 for(const r of stones){if(Math.abs(r.x)<2.6&&r.z>-.8)continue;scene.box([r.x,r.s*.18,r.z],[r.s,r.s*.35,r.s*.8],'#8B806B',r.a);}
 // Dry-stone ruin: stepped blocks, broken columns, one irregular lintel.
 for(const x of [-5.5,5.4])for(let j=0;j<5;j++)scene.box([x,.24+j*.46,-5.0],[.72,.43,.72],j%2?'#9B937D':'#ACA18A',j*.018);
 scene.box([5.1,2.62,-5.0],[2.7,.42,.82],'#9B947F',-.10);
 for(let i=0;i<5;i++)scene.box([-4.5+i*.62,.14+i%2*.08,-3.6],[.62,.3,.66],'#B0A18A',i*.3);
 if(n>=13&&n<=14){for(let i=0;i<150;i++){const a=grains[i],x=(a.x-.5)*12,z=-a.y*8;scene.rod([x,0,z],[x+.05,.15+a.z*.1,z],.012,'#526141',3);}}
 if(n>=15&&n<=18){
  // Broken war chariot with sloping planks and two spoked wheels.
  for(let j=0;j<4;j++){const x=-1.6+j*.38;scene.face([[x,.12,-.95],[x+.32,.12,-.95],[x+.32,1.04,-2.1],[x,1.04,-2.1]],'#796044');}
  for(const x of [-1.9,.1]){
   const c=[x,.48,-1.7];for(let i=0;i<12;i++){const a=i/12*TAU,b=(i+1)/12*TAU,p=add(c,[0,Math.cos(a)*.48,Math.sin(a)*.48]),q=add(c,[0,Math.cos(b)*.48,Math.sin(b)*.48]);scene.rod(p,q,.04,'#694A32',5);scene.rod(c,p,.018,'#967148',4);}
  }
 }
 if(n===22)for(let j=0;j<3;j++)scene.box([-.5,.25+j*.46,-.9],[1.7,.43,.30],'#9C927C');
 if(n>=18&&n<=25){
  scene.box([-.8,.09,-.8],[1.6,.18,.24],'#786044',.2);
  const pts=[];for(let i=0;i<16;i++){const a=i/16*TAU;pts.push([-1.6+Math.cos(a)*.32,.04,-.7+Math.sin(a)*.32]);}scene.face(pts,'#354C55',{edge:1});
  if((n===18&&t>=86.3)||n===19||(n===20&&t<99.4))blade(scene,[-.4,.25,-.7],norm([-.75,-.14,.4]),'#AD9465',.82,.06,true);
 }
 if(scene.env.wet>.12){
  for(let i=0;i<12;i++){const a=grains[i],x=(a.x-.5)*13,z=(a.y-.5)*10;const pts=[];for(let k=0;k<10;k++){const angle=k/10*TAU;pts.push([x+Math.cos(angle)*(.45+a.z),.006,z+Math.sin(angle)*(.25+a.z*.4)]);}scene.face(pts,'#8D9996',{alpha:.22+scene.env.wet*.22,unlit:true});}
 }
}
function shadow(scene,p,size=1){const pts=[];for(let i=0;i<14;i++){const a=i/14*TAU;pts.push([p[0]+Math.cos(a)*.34*size,.015,p[2]+Math.sin(a)*.24*size]);}scene.face(pts,'#242D29',{alpha:.32,bias:-.008,unlit:true});}
function crowd(scene,t,n){
 if(n===1||n===24)return;
 const count=n>=7&&n<=9?300:n>=32?32:28;
 for(let i=0;i<count;i++){
  const col=i%(count===300?15:8),row=Math.floor(i/(count===300?15:8)),x=2+col*.78,z=-3.0-row*.66;
  const retreat=n>=32?clamp((t-155)/20)*7:0;
  soldierLOD(scene,[x+(n>=32?retreat:0),0,z-retreat],n>=32?Math.PI*.2:-Math.PI/2,t*.45,i);
 }
}
function debris(scene,t,shot){
 const n=shot.number;for(const hit of shot.impacts){
  const a=t-hit/60;if(a<0||a>1.1)continue;
  const rand=rng(shot.seed+hit),type=n===14||n===5?'wood':n===31?'metal':'sparks';
  for(let k=0;k<(type==='sparks'?12:22);k++){
   const v=[(rand()-.35)*2.6,1.2+rand()*2.5,(rand()-.5)*2.2],origin=[.45,n===18?.05:1.25,.05],p=add(origin,[v[0]*a,v[1]*a-4.905*a*a,v[2]*a]);if(p[1]<0)continue;
   if(type==='sparks'){const tail=sub(p,mul(v,.02));scene.rod(tail,p,.006,k%3?'#D9B778':'#E9D7A8',3,{unlit:true,alpha:1-a/1.1});}
   else scene.box(p,[.06+rand()*.09,.03,.06],type==='wood'?'#927047':'#AC9B7F',a*(3+rand()*5),{metal:type==='metal'});
  }
 }
}
function projectiles(scene,shot,t,hero){
 const n=shot.number;
 if(n===7||n===8)for(let i=0;i<16;i++){
  const a=(t+i*.18)%3,x=7-a*3.4,z=-1+(i%5)*.34,y=1.2+(i%4)*.19;
  scene.rod([x,y,z],[x+.6,y+.015,z],.008,'#40382D',4);scene.face([[x,y,z],[x+.08,y+.035,z],[x+.08,y-.035,z]],'#C0B79B',{metal:true});
 }
 if(n===16){
  const archerPose=poseFor(shot,t,'enemy');archerPose.weapon=false;archerPose.shield=false;archerPose.hands=[[-.1,1.6,.5],[.15,1.6,.5]];
  actor(scene,{name:'Enemy',position:[3.6,0,-1.3],yaw:-Math.PI/2,pose:archerPose,time:75+t,enemy:true});
  const age=Math.max(0,t-3.16),bow=[];for(let i=0;i<11;i++){const a=i/10*Math.PI;bow.push([3.4+Math.sin(a)*.23+(i-5)*age*.12,1.2+i*.11-age*age*.7,-1.15]);}
  for(let i=0;i<10;i++)if(!(age>0&&i===5))scene.rod(bow[i],bow[i+1],.018,'#886943',5);
  if(!age)scene.rod(bow[0],bow[10],.004,'#C3B795',3);
  const center=hero.hands[1],a=t*5.4,r=.37,p=add(center,[Math.cos(a)*r,Math.sin(a)*r,0]);
  if(t<2.8){scene.rod(center,p,.007,'#57432C',4);scene.ellipsoid(p,[.033,.029,.028],'#BDB29A',6,4);}
  if(t>=2.8&&t<4){const q=clamp((t-2.8)/1.2);const stone=[-.4+q*13,2.9-q*.7,-q*3];scene.ellipsoid(stone,[.035,.035,.035],'#D2C6AC',6,4);scene.rod(sub(stone,[.45,0,-.1]),stone,.005,'#CDC6AD',3,{alpha:.25});}
 }
 if(n===17){const a=clamp((t-.5)/2.6),p=[5-a*9,2.7-a*.15,.6];scene.rod(p,add(p,[.95,0,0]),.015,'#7A6243',5);blade(scene,p,[-1,0,0],'#B8B8A1',.22,.03);}
 if(n===20&&t>1.7&&t<2.6){const a=(t-1.7)/.9;const p=[.75-a*.8,1.3+Math.sin(a*Math.PI)*.65,.14];blade(scene,p,norm([Math.sin(a*5),Math.cos(a*5),0]),'#BDB79F',.34,.03);}
 if(n===21&&t<.9){const q=t/.9,p=[-.15,2.1-q*.8,.1];blade(scene,p,[0,-1,0],'#B49E74',.82,.06,true);}
}
function atmosphere(ctx,scene,env,t,n){
 // Sparse foreground dust, then depth-layered rain. No post-process blur on the whole image.
 if(env.rain<.6){
  for(let i=0;i<100;i++){const g=grains[i],x=((g.x*2150+t*(11+g.z*22))%2150)-100,y=350+g.y*700;ctx.fillStyle=`rgba(222,197,150,${(.07+g.z*.08)*(1-env.rain)})`;ctx.beginPath();ctx.ellipse(x,y,.6+g.z*2,.4+g.z,0,0,TAU);ctx.fill();}
 }
 if(env.rain>.02){
  ctx.lineCap='round';for(let i=0;i<Math.floor(230*env.rain);i++){const r=rain[i],x=((r.x*2200-t*(60+env.wind*4))%2200+2200)%2200-140,y=((r.y*1350+t*(360+r.speed*170))%1300)-100;ctx.strokeStyle=`rgba(190,207,207,${.06+r.z*.16})`;ctx.lineWidth=.6+r.z*.8;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-10-r.z*8,y+25+r.z*22);ctx.stroke();}
  // Baked lens-corner beads, outside the central contact area.
  for(let i=0;i<9;i++){const a=grains[i],x=i%2?1810+a.x*80:20+a.x*70,y=150+a.y*720;ctx.strokeStyle='rgba(191,210,208,.13)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,3+a.z*5,7+a.z*11,-.1,0,TAU);ctx.stroke();}
 }
 if(n===18){const age=t-85.6;if(age>=0&&age<1.6){const p=scene.project([-.4,0,0]),r=(.2+age*2.2)*p.scale;ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.28);ctx.strokeStyle=`rgba(216,189,138,${.30*Math.exp(-age*1.8)})`;ctx.lineWidth=8*(1-age/1.7);ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();ctx.restore();}}
 // Vignette is optical framing, not a substitute for lighting geometry.
 const vignette=ctx.createRadialGradient(960,500,450,960,540,1120);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(5,11,13,.42)');ctx.fillStyle=vignette;ctx.fillRect(0,50,1920,980);
}
function lowerTitles(ctx,frame,shot){
 const t=frame/60,labels=[[0,'I','The valley of shadows'],[30,'II','The rise of the three'],[70,'III','Acrobatic warfare'],[110,'IV','The apex exchanges'],[155,'V','The king’s triumph']];
 for(const [start,num,label]of labels){const age=t-start;if(age>.45&&age<3.7){const a=clamp(spring(age-.45,6,1))*clamp((3.7-age)/.5);ctx.globalAlpha=a;ctx.fillStyle='#C1A577';ctx.fillRect(96,878,36,2);text(ctx,`${num}  /  ${label}`,96,916,21,'#E2D3B5','Serif');ctx.globalAlpha=1;}}
 for(const [start,name]of [[30,'Josheb'],[45,'Eleazar'],[60,'Shammah']]){const age=t-start;if(age>.5&&age<3.5){const a=clamp(spring(age-.5,5,1))*clamp((3.5-age)/.5);ctx.globalAlpha=a;text(ctx,name,96,862,35,'#E8D9BC','Serif');ctx.globalAlpha=1;}}
}
function finalTitle(ctx,frame){
 if(frame<10500)return;
 const t=(frame-10500)/60,alpha=clamp(spring(t,4.8,1)),sub=clamp(spring(t-.7,5,1));
 ctx.fillStyle=`rgba(7,13,17,${.45*alpha})`;ctx.fillRect(0,50,1920,980);
 ctx.save();ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.font='132px "Cinzel"';ctx.lineWidth=1.2;ctx.strokeStyle='#E2D2AE';
 ctx.fillStyle='#252B29';ctx.fillText('VALOR',964,506);const metal=ctx.createLinearGradient(0,380,0,510);metal.addColorStop(0,'#E3C994');metal.addColorStop(.4,'#AA8755');metal.addColorStop(.48,'#D7BE8F');metal.addColorStop(1,'#806847');ctx.fillStyle=metal;ctx.fillText('VALOR',960,500);ctx.strokeText('VALOR',960,500);
 ctx.globalAlpha=sub;text(ctx,'THE CHRONICLES OF DAVID',960,564,29,'#D8C6A5','Cinzel','center');ctx.fillStyle='#B09363';ctx.fillRect(800,606,320,1);ctx.restore();
 const fade=smooth((frame-10716)/72);if(fade>0){ctx.fillStyle=`rgba(0,0,0,${fade})`;ctx.fillRect(0,0,1920,1080);}if(frame>=10788){ctx.fillStyle='#000000';ctx.fillRect(0,0,1920,1080);}
}
export function drawFrame(ctx,frame,width=WIDTH,height=HEIGHT){
 if(!Number.isInteger(frame)||frame<0||frame>=FRAMES)throw new RangeError('Frame outside 0..10799');
 const shot=SHOTS[Math.floor(frame/300)],n=shot.number,t=frame/60,local=frame%300/60,env=environment(t),camera=cameraAt(frame);
 ctx.save();ctx.resetTransform();ctx.scale(width/1920,height/1080);ctx.globalAlpha=1;
 backdrop(ctx,env,t);ctx.save();ctx.beginPath();ctx.rect(0,50,1920,980);ctx.clip();
 const scene=new Scene3D(ctx,camera,env);environmentMesh(scene,t,n);const backgroundStats={...scene.render()};scene.faces=[];crowd(scene,t,n);
 let posed=local;
 const minSpeed=Math.min(...shot.speed_keys.map(k=>k[1]));
 if(minSpeed<.6&&shot.impacts.length){const nearest=shot.impacts.map(h=>h/60).sort((a,b)=>Math.abs(a-local)-Math.abs(b-local))[0],dt=local-nearest;if(Math.abs(dt)<.9)posed=nearest+dt*(minSpeed+(1-minSpeed)*smooth(Math.abs(dt)/.9));}
 for(const h of shot.impacts){if(frame%300>=h&&frame%300<h+3)posed=h/60;}
 const heroName=['Josheb','Eleazar','Shammah'].includes(shot.hero)?shot.hero:'David';
 const heroPose=poseFor(shot,posed);let heroPos=[-.65,0,0],heroYaw=Math.PI/2;
 if(n===1){heroPos=[0,0,0];heroYaw=0;heroPose.shield=false;heroPose.hands=[[-.25,1.0,.25],[.25,1.0,.25]];}
 if(n===2){heroPos=[0,0,0];heroYaw=mix(0,Math.PI/2,smooth(local/3));}
 if(n>=7&&n<=9)heroPos=[-.7,0,0];
 if(n>=15&&n<=18)heroPos=[-.5,0,0];
 if(n===22)heroPos[2]=-.57*pulse(local,1.6,.55);
 if(n>=32){heroPos=[0,0,0];heroYaw=.28;}
 shadow(scene,heroPos,1.2);
 const hero=actor(scene,{name:heroName,position:heroPos,yaw:heroYaw,pose:heroPose,time:t,carryShield:n<=17,detail:n===1?2:1});
 if(n!==1&&n!==2&&n<32&&![7,10,13,15,16,17,23,24].includes(n)){
  const champion=n>=25,enemyPose=poseFor(shot,posed,'enemy');if(n===14&&local>shot.impacts[0]/60)enemyPose.shield=false;if(champion){enemyPose.shield=false;enemyPose.hands[1]=[-.05,enemyPose.hands[0][1]-.1,enemyPose.hands[0][2]-.08];}let enemyPos=[1.0,0,.4];
  if(n===19){const f=smooth((local-1.9)/1.15);enemyPose.fall=f;enemyPos=[.72+f*.6,.5*pulse(local,2.15,.45),-.05];}
  shadow(scene,enemyPos,champion?1.5:1.1);
  actor(scene,{name:champion?'Champion':'Enemy',position:enemyPos,yaw:-Math.PI/2,pose:enemyPose,time:t+.4,enemy:true,scale:champion?1.2:1.05,damage:n===31&&local>1.6?1:0});
 }
 if([5,6,9,11,12,14,18,21,22].includes(n))for(let i=0;i<([21,22].includes(n)?4:[5,6,11,12].includes(n)?1:2);i++){
  const p=poseFor(shot,posed,'enemy',i+1),pos=[2.5+i*.55,0,-.8-i*.7];shadow(scene,pos,1);actor(scene,{name:'Enemy',position:pos,yaw:-Math.PI/2,pose:p,time:t+i,enemy:true,scale:1.0});
 }
 if(n>=32)for(const [i,name]of ['Josheb','Eleazar','Shammah'].entries()){
  const dummy={...shot,number:[7,10,13][i],impacts:[]};const p=poseFor(dummy,0);p.hands=[[-.25,1.15,.3],[.25,1.1,.3]];const pos=[-1.8+i*1.65,0,-2.4-i*.35];shadow(scene,pos,1);actor(scene,{name,position:pos,yaw:.3,pose:p,time:t+i,scale:1.0});
 }
 projectiles(scene,shot,posed,hero);debris(scene,local,shot);const stats=scene.render();
 atmosphere(ctx,scene,env,t,n);ctx.restore();
 lowerTitles(ctx,frame,shot);
 ctx.fillStyle='#090D0E';ctx.fillRect(0,0,1920,50);ctx.fillRect(0,1030,1920,50);
 finalTitle(ctx,frame);ctx.restore();
 return {frame,shot:shot.id,faces:stats.faces+backgroundStats.faces,heroProjected:scene.project(hero.head),isBlack:frame>=10788,storm:env.storm};
}
