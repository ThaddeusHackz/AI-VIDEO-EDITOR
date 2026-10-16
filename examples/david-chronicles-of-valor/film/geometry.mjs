// A deterministic CPU 3D renderer: perspective geometry, per-face lighting,
// depth sorting and atmospheric attenuation. Stylized, not ray-traced or Unreal.
import {Vector3} from './vendor/three.core.min.js';
export const V=(x=0,y=0,z=0)=>[x,y,z];
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const length=a=>Math.hypot(...a);
export const norm=a=>mul(a,1/(length(a)||1));
export const mix=(a,b,t)=>a+(b-a)*t;
export const lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const spring=(t,w=8,z=.85)=>t<=0?0:z>=1?1-(1+w*t)*Math.exp(-w*t):1-Math.exp(-z*w*t)*(Math.cos(w*Math.sqrt(1-z*z)*t)+z/Math.sqrt(1-z*z)*Math.sin(w*Math.sqrt(1-z*z)*t));
export const pulse=(t,c,w)=>Math.exp(-(((t-c)/w)**2));
export function rng(seed){return()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const colors=new Map();
export function rgb(hex){if(!colors.has(hex))colors.set(hex,[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));return colors.get(hex);}
export const colorMix=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
export const css=c=>`rgb(${c.map(v=>Math.round(clamp(v,0,255))).join(',')})`;
export function transform(p,origin,yaw=0,roll=0,scale=1){
 const c=Math.cos(yaw),s=Math.sin(yaw),r=Math.cos(roll),q=Math.sin(roll);
 const x=(p[0]*c+p[2]*s)*scale,y=p[1]*scale,z=(-p[0]*s+p[2]*c)*scale;
 return [origin[0]+x*r-y*q,origin[1]+x*q+y*r,origin[2]+z];
}
export function twoBone(root,target,l1,l2,pole){
 const delta=sub(target,root),d=clamp(length(delta),.0001,l1+l2-.0001),axis=norm(delta);
 const end=add(root,mul(axis,d));
 const along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));
 let bend=sub(sub(pole,root),mul(axis,dot(sub(pole,root),axis)));
 if(length(bend)<.0001)bend=cross(axis,[0,0,1]);
 const joint=add(add(root,mul(axis,along)),mul(norm(bend),h));
 return {joint,end};
}
export class Scene3D{
 constructor(ctx,camera,env){
  this.ctx=ctx;this.camera=camera;this.env=env;this.faces=[];this.stats={faces:0,clipped:0};
  const pos=new Vector3(...camera.pos),forward=new Vector3(...camera.target).sub(pos).normalize(),right=new Vector3().crossVectors(forward,new Vector3(0,1,0)).normalize(),up=new Vector3().crossVectors(right,forward).normalize();
  this.forward=forward.toArray();this.right=right.toArray();this.up=up.toArray();this.focal=(camera.filmGate??960)/Math.tan(camera.fov*Math.PI/360);
  this.light=norm(env.light||[-.5,.9,.4]);this.fog=env.fogColor;this.bg=env.fogColor;
 }
 cam(p){const d=sub(p,this.camera.pos);return [dot(d,this.right),dot(d,this.up),dot(d,this.forward)];}
 project(p){const v=this.cam(p);return{x:960+v[0]*this.focal/Math.max(.035,v[2]),y:540-v[1]*this.focal/Math.max(.035,v[2]),depth:v[2],scale:this.focal/Math.max(.035,v[2])};}
 face(points,color,options={}){
  let verts=points.map(p=>this.cam(p));
  if(verts.every(p=>p[2]<.035)){this.stats.clipped++;return;}
  if(verts.some(p=>p[2]<.035)){
   const out=[];
   for(let i=0;i<verts.length;i++){const a=verts[i],b=verts[(i+1)%verts.length],aa=a[2]>=.035,bb=b[2]>=.035;if(aa)out.push(a);if(aa!==bb)out.push(lerp(a,b,(.035-a[2])/(b[2]-a[2])));}
   verts=out;if(verts.length<3)return;
  }
  const projected=verts.map(p=>[960+p[0]*this.focal/p[2],540-p[1]*this.focal/p[2]]);
  if(projected.every(p=>p[0]<-20)||projected.every(p=>p[0]>1940)||projected.every(p=>p[1]<40)||projected.every(p=>p[1]>1040))return;
  const n=norm(cross(sub(points[1],points[0]),sub(points[2],points[0]))),center=mul(points.reduce((s,p)=>add(s,p),[0,0,0]),1/points.length);
  const depth=verts.reduce((s,p)=>s+p[2],0)/verts.length;
  const diffuse=Math.abs(dot(n,this.light)),view=norm(sub(this.camera.pos,center)),half=norm(add(this.light,view));
  const spec=options.metal?Math.pow(Math.abs(dot(n,half)),22)*.48:0;
  const brightness=options.unlit?1:(.31+diffuse*.68)*(1-this.env.storm*.18);
  let c=rgb(color).map((v,i)=>v*brightness+spec*[225,208,173][i]);
  const fog=clamp((1-Math.exp(-Math.max(0,depth-4)*(.014+.024*this.env.storm)))*.82);
  c=colorMix(c,this.fog,options.noFog?0:fog);
  this.faces.push({p:projected,depth:depth+(options.bias||0),fill:css(c),alpha:options.alpha??1,edge:options.edge??0});
 }
 line(a,b,color,width=.01,options={}){this.rod(a,b,width,color,4,options);}
 box(center,size,color,yaw=0,options={}){
  const pts=[];for(let i=0;i<8;i++)pts.push(transform([(i&1?1:-1)*size[0]/2,(i&2?1:-1)*size[1]/2,(i&4?1:-1)*size[2]/2],center,yaw));
  for(const ids of [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])this.face(ids.map(i=>pts[i]),color,options);
 }
 ellipsoid(center,radii,color,segments=10,rings=6,options={},map=null){
  const point=(u,v)=>{const p=[Math.sin(u)*Math.cos(v)*radii[0]+center[0],Math.sin(v)*radii[1]+center[1],Math.cos(u)*Math.cos(v)*radii[2]+center[2]];return map?map(p):p;};
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
   const u=i/segments*Math.PI*2,w=(i+1)/segments*Math.PI*2,v=-Math.PI/2+j/rings*Math.PI,z=-Math.PI/2+(j+1)/rings*Math.PI;
   this.face([point(u,v),point(w,v),point(w,z),point(u,z)],color,options);
  }
 }
 rod(a,b,r,color,segments=7,options={},r2=r){
  const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[2])>.9?[0,1,0]:[0,0,1])),v=cross(axis,u),aa=[],bb=[];
  for(let i=0;i<segments;i++){const q=i/segments*Math.PI*2,d=add(mul(u,Math.cos(q)),mul(v,Math.sin(q)));aa.push(add(a,mul(d,r)));bb.push(add(b,mul(d,r2)));}
  for(let i=0;i<segments;i++){const j=(i+1)%segments;this.face([aa[i],aa[j],bb[j],bb[i]],color,options);}this.face([...aa].reverse(),color,options);this.face(bb,color,options);
 }
 frustum(center,y0,y1,rx0,rz0,rx1,rz1,color,map,wind=0,segments=10,options={}){
  const lo=[],hi=[];
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2;lo.push(map([center[0]+Math.sin(a)*rx0+wind*Math.cos(a),y0,center[2]+Math.cos(a)*rz0]));hi.push(map([center[0]+Math.sin(a)*rx1,y1,center[2]+Math.cos(a)*rz1]));}
  for(let i=0;i<segments;i++){const j=(i+1)%segments;this.face([lo[i],lo[j],hi[j],hi[i]],color,options);}this.face(hi,color,options);
 }
 render(){
  const ctx=this.ctx;this.faces.sort((a,b)=>b.depth-a.depth);
  for(const f of this.faces){ctx.globalAlpha=f.alpha;ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=f.fill;ctx.fill();if(f.edge){ctx.strokeStyle=f.fill;ctx.lineWidth=f.edge;ctx.stroke();}}
  ctx.globalAlpha=1;this.stats.faces=this.faces.length;return this.stats;
 }
}
