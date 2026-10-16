import {add,sub,mul,norm,cross,lerp,mix,clamp,smooth,pulse,transform,twoBone} from './geometry.mjs';
const TAU=Math.PI*2;
export function flightHeight(t){
 if(t<75||t>85.6)return 0;
 const v=2.4,h=1.4,g=9.81,T=(v+Math.sqrt(v*v+2*g*h))/g,keys=[[75,0],[77.8,v/g],[80,.42],[85.6,T]];
 let tau=T;for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const a=keys[i-1],b=keys[i];tau=mix(a[1],b[1],smooth((t-a[0])/(b[0]-a[0])));break;}
 return Math.max(0,h+v*tau-.5*g*tau*tau);
}
export const COSTUMES={David:{skin:'#B98B68',cloth:'#A78A5A',trim:'#354C55',hair:'#29251F',metal:'#AD9465'},Josheb:{skin:'#A47756',cloth:'#9D5945',trim:'#4B3328',hair:'#30271F',metal:'#AA966E'},Eleazar:{skin:'#BC9475',cloth:'#8C8B74',trim:'#493F36',hair:'#4D392B',metal:'#A3A6A0'},Shammah:{skin:'#976D4C',cloth:'#5B4938',trim:'#A5814D',hair:'#251F1B',metal:'#99856A'},Enemy:{skin:'#A88B70',cloth:'#5E6564',trim:'#4C3B31',hair:'#332C26',metal:'#8D8A78'},Champion:{skin:'#9C7B5D',cloth:'#464E50',trim:'#392B25',hair:'#26211E',metal:'#A89575'}};
export function poseFor(shot,t,role='hero',index=0){
 const n=shot.number,hitTimes=shot.impacts.map(f=>f/60),contacts=hitTimes.length?hitTimes:[1.8,3.7];
 let A=0,W=0,R=0;for(const h of contacts){A+=pulse(t,h,.24);W+=pulse(t,h-.48,.27);R+=pulse(t,h+.32,.33);}
 const p={height:.96,lean:0,head:0,hands:[[-.25,1.17,.40],[.26,1.14,.32]],feet:[[-.16,0,.20],[.18,0,-.22]],sword:[.05,.8,.65],sword2:[0,.65,.65],yawAdd:0,rootY:0,rootX:0,fall:0,shield:true,spear:false,dagger:false,weapon:true,plant:false};
 const attack=role==='enemy'?1-A:A;
 if(role==='enemy'){
  p.hands[0]=[-.25,1.35+.35*W+.16*A,.38-.30*W+.15*A];p.sword=[0,.8+.2*W-.4*A,.65+.2*A];p.lean=-.12*W+.08*A;
  if((n===4||n===5||n===6||n===9||n===14||n===19||n===22)&&t>contacts[0]+.25+index*.15){p.fall=smooth((t-contacts[0]-.25-index*.15)/1.0);p.rootX=.3*p.fall;}
  if(n===31){p.height=.96-.4*smooth((t-2)/1.3);p.lean=.35*smooth((t-2)/1.3);}
  return p;
 }
 if(![1,2,7,10,13,15,16,17,18,23,24,25,32,33,34,35,36].includes(n)){
  p.hands[0]=[-.27-.09*W,1.2+.43*W-.08*A,.38-.49*W+.23*A];p.sword=[.08,.76+.2*W-1.05*A,.6+.4*A];p.lean=.12*A-.11*W;p.height-=.09*W;
 }
 if([3,26,27,28,29].includes(n)){
  p.height-=.20*A;p.lean=-.16*A;p.hands[0]=[-.18,1.2+.26*A,.40];p.sword=[.1,.82,.4];
  if(n===27)p.rootX=-.20*W;
 }
 if(n===4){const jump=clamp((t-1.5)/1.25);p.rootY=1.0*4*jump*(1-jump);p.feet[0]=[-.16,.55*pulse(t,1.85,.7),.40];p.feet[1]=[.18,.12,.03];p.hands[1]=[.25,1.28,.36];p.lean=-.08;}
 if(n===5){p.hands[1]=[.24,1.22,.36+.29*A];p.lean=.15*A;}
 if(n===6){const q=smooth((t-.55)/2.7);p.yawAdd=TAU*q;p.height=.96-.31*pulse(t,1.9,.85);p.feet[1]=[.20,.10,.23+.58*pulse(t,2.1,.7)];p.hands[0]=[-.3,1.18,.3];}
 if([7,8,9].includes(n)){
  p.shield=false;p.spear=true;let a=n===8?t*5:0;
  p.hands[0]=[-.18,1.12+.10*Math.sin(a),.36];p.hands[1]=[.22,1.04,.55];p.sword=norm(sub(p.hands[1],p.hands[0]));
  if(n===8)p.sword=norm([.5,Math.sin(a)*1.0,Math.cos(a)*1.0]);
  if(n===9){p.rootX=.25*A;p.height-=.10*W;p.sword=norm([.3,.10,1]);p.hands[0][2]+=.14*A;}
 }
 if([10,11,12].includes(n)){p.shield=false;p.dagger=true;p.sword2=[0,.7,.7];p.hands[1]=[.27,1.20+.22*R,.35+.10*W];if(n===12)p.rootY=.42*pulse(t,1.5,.6);}
 if([13,14].includes(n)){p.shield=false;p.hands[0]=[-.16,1.5+.12*W-.4*A,.30+.2*A];p.hands[1]=[.18,1.38+.12*W-.4*A,.28+.2*A];p.sword=[0,1-.95*A,.25+.75*A];p.lean=.28*A;p.height-=.16*W;}
 if(n===15){const cycle=t*7;p.rootX=-1.4+2.5*smooth(t/5);p.rootY=1.35*smooth((t-2.1)/2.9);p.feet[0]=[-.16,Math.max(0,Math.sin(cycle))*.15,Math.cos(cycle)*.34];p.feet[1]=[.18,Math.max(0,-Math.sin(cycle))*.15,-Math.cos(cycle)*.34];p.lean=.18;p.shield=false;}
 if(n===16){p.rootY=flightHeight(75+t);p.hands[1]=[.3,1.45,.35];p.feet=[[-.15,.20,.25],[.18,.40,-.20]];p.shield=false;p.sword=[0,-.45,.8];p.lean=-.12;}
 if(n===17){p.rootY=flightHeight(80+t);p.yawAdd=1.6*smooth(t/4);p.lean=.10;p.feet=[[-.16,.10,.30],[.18,.17,-.25]];p.shield=false;}
 if(n===18){p.rootY=flightHeight(85+t);p.height=.96-.43*pulse(t,.65,.38);p.weapon=t<1.3;p.shield=false;}
 if(n===19){p.weapon=false;p.shield=false;p.height-=.23*W;p.lean=.24*A;p.hands=[[-.28,1.0,.52],[.25,1.10,.5]];p.yawAdd=.7*pulse(t,2.6,.55);}
 if(n===20){p.weapon=false;p.shield=false;p.dagger=t>2.55;p.hands=[[-.3,1.2,.50],[.27,1.3,.43]];p.yawAdd=.35*A;}
 if(n===21||n===22){p.shield=false;p.dagger=true;p.weapon=n===21?t>.9:true;p.hands[1]=[.27,1.05+.2*R,.43];if(n===22){p.rootY=.4*pulse(t,1.6,.55);p.rootX=.35*smooth(t/5);}}
 if(n===23||n===25){p.hands=[[-.25,1.0,.35],[.26,1.1,.3]];p.sword=[0,.8,.5];p.shield=false;}
 if(n===24){p.hands[0]=[-.2,1.2,.45];p.sword=[.2,.65,.7];p.shield=false;}
 if(n===30){p.height=.52+.13*smooth(t/5);p.rootX=.55*smooth(t/5);p.lean=.15;p.shield=false;p.sword=[0,.2,1];}
 if(n===31){p.height=.65+.31*smooth(t/2);p.hands[0]=[-.24,1.05+.35*A,.42];p.sword=[0,.7+.3*A,.6-.1*A];p.shield=false;}
 // The shield stays on the ground after the landing; it never reappears in the duel.
 if([26,27,28,29].includes(n))p.shield=false;
 if(n>=32){p.shield=false;p.sword=[0,-.8,.55];p.hands[0]=[-.23,.82,.30];p.hands[1]=[.27,.90,.10];p.lean=.02;}
 if(n>=34){const plant=n===34?smooth((t-.7)/2.4):1;p.plant=true;p.hands[0]=[-.1,1.0-.08*plant,.45];p.hands[1]=[.10,1.02-.08*plant,.45];p.sword=[0,-1,0];p.lean=.06*plant;}
 return p;
}
export function actor(scene,config){
 const {name='David',position=[0,0,0],yaw=0,pose=pDefault(),scale=1,detail=1,time=0,enemy=false,damage=0}=config;
 const C=COSTUMES[name]||COSTUMES.Enemy;const root=add(position,[pose.rootX||0,(pose.rootY||0)+.07*(pose.fall||0),0]);
 const fall=pose.fall||0;const yawAll=yaw+(pose.yawAdd||0);const roll=-fall*1.48;
 const T=p=>transform(p,root,yawAll,roll,scale),height=pose.height+.007*Math.sin(time*2.6);
 const torso=p=>T([p[0],p[1]+height-.96,p[2]+(p[1]-.96)*(pose.lean||0)]);
 // Anatomically proportioned limbs with analytic two-bone IK, rather than disconnected sticks.
 const skin=C.skin,cloth=C.cloth,boots='#3D3028';
 for(let side=0;side<2;side++){
  const hip=[side? .15:-.15,height,0],foot=pose.feet[side];const ik=twoBone(hip,add(foot,[0,.08,0]),.46,.46,[hip[0],.4,1]);
  scene.rod(T(hip),T(ik.joint),.102,cloth,6,{},.079);scene.rod(T(ik.joint),T(ik.end),.075,skin,6,{},.052);
  scene.rod(T(add(ik.end,[0,.04,0])),T(add(ik.end,[0,.23,0])),.060,boots,6);
  scene.ellipsoid(add(foot,[0,.05,.065]),[.085,.06,.18],boots,6,4,{},T);
  // Two leather bindings across each shin.
  for(const h of [.15,.24])scene.rod(T(add(ik.end,[0,h,0])),T(add(ik.end,[0,h+.024,0])),.066,'#9F8057',6);
 }
 const wind=(.012+.012*scene.env.storm)*Math.sin(time*2.1);
 scene.frustum([0,0,0],height-.32,height+.06,.32,.20,.22,.15,cloth,T,wind,10);
 scene.frustum([0,0,0],.96,1.44,.22,.145,.275,.155,cloth,torso,0,10);
 scene.frustum([0,0,0],height-.01,height+.065,.245,.16,.245,.16,C.trim,T,0,10);
 // Layered diagonal leather baldric and shoulder edging.
 scene.rod(torso([-.23,1.42,.14]),torso([.17,1.02,.17]),.034,C.trim,4);
 scene.rod(torso([-.245,1.42,0]),torso([.245,1.42,0]),.052,C.trim,6);
 if(enemy||name==='Champion'){
  scene.frustum([0,0,.02],1.05,1.42,.245,.16,.30,.17,C.metal,torso,0,8,{metal:true});
  for(const side of [-1,1])if(!(damage>.5&&side===1))scene.ellipsoid([side*.285,1.43,0],[.15,.10,.19],C.metal,8,4,{metal:true},torso);
 }
 // A short, physically attached cape follows the back in a damped wind arc.
 if(!enemy){
  const pts=[];for(let j=0;j<6;j++){const u=j/5;pts.push([[-.22*(1+u*.35),1.42-u*.69,-.14-u*.13+Math.sin(time*2.3-u*2)*wind*u],[.22*(1+u*.35),1.42-u*.69,-.14-u*.13+Math.sin(time*2.3-u*2)*wind*u]]);}
  for(let j=0;j<5;j++)scene.face([pts[j][0],pts[j][1],pts[j+1][1],pts[j+1][0]].map(torso),C.trim);
 }
 scene.rod(torso([0,1.40,0]),torso([0,1.57,0]),.075,skin,8);
 const headY=1.64, headMap=p=>torso(p);
 scene.ellipsoid([0,headY,0],[.145,.205,.14],skin,detail>1?16:10,detail>1?10:6,{},headMap);
 // Hair wraps the crown and back but leaves the face open.
 const hairRings=detail>1?8:5,segs=detail>1?16:10;
 for(let j=0;j<hairRings;j++)for(let i=0;i<segs;i++){
  const point=(u,v)=>headMap([Math.sin(u)*Math.cos(v)*.151,headY+Math.sin(v)*.211,Math.cos(u)*Math.cos(v)*.145]);
  const a=i/segs*TAU,b=(i+1)/segs*TAU,v=j/hairRings*Math.PI/2,z=(j+1)/hairRings*Math.PI/2;
  if(j===0&&Math.cos((a+b)/2)>.45)continue;scene.face([point(a,v),point(b,v),point(b,z),point(a,z)],C.hair);
 }
 scene.ellipsoid([0,1.565,.09],[.115,.085,.07],C.hair,8,4,{},headMap);
 // Nose wedge, cheek planes, lips and individual eyes make close-ups deliberate.
 scene.face([[-.025,1.69,.125],[.025,1.69,.125],[.031,1.60,.18],[-.031,1.60,.18]].map(headMap),skin);
 scene.face([[0,1.71,.14],[.031,1.60,.18],[0,1.61,.204],[-.031,1.60,.18]].map(headMap),skin);
 const blink=1-.92*pulse(time%4.8,4.45,.055);
 for(const side of [-1,1]){
  const x=side*.063;
  scene.ellipsoid([x,1.679,.127],[.035,.008*blink,.016],'#D6CDB4',8,4,{},headMap);
  scene.ellipsoid([x+.003,1.678,.143],[.008,.008*blink,.005],'#4C4431',8,4,{},headMap);
  scene.ellipsoid([x+.003,1.678,.149],[.0045,.006*blink,.003],'#161B1C',6,3,{},headMap);
  if(detail>1)scene.ellipsoid([x,1.682,.152],[.0022,.0022,.002],'#F3ECD3',5,3,{unlit:true},headMap);
  scene.rod(headMap([x-side*.034,1.709,.126]),headMap([x+side*.035,1.706,.127]),.008,C.hair,4);
 }
 if(detail>1){const y=1.72-.085*smooth((time-.8)/4);scene.ellipsoid([.103,y,.119],[.0025,.006,.0025],'#C9BA96',6,4,{metal:true},headMap);}
 scene.rod(headMap([-.037,1.565,.154]),headMap([.037,1.565,.154]),.006,'#735044',5);
 if(enemy){
  scene.ellipsoid([0,1.77,-.01],[.162,.13,.155],C.metal,8,4,{metal:true},headMap);
  for(const side of [-1,1])scene.face([[side*.13,1.73,.07],[side*.14,1.54,.09],[side*.105,1.52,.12],[side*.10,1.73,.13]].map(headMap),C.metal,{metal:true});
  if(name==='Champion')scene.rod(headMap([0,1.85,-.09]),headMap([0,1.95,.08]),.035,'#6B4D37',5);
 }
 const hands=[];
 for(let side=0;side<2;side++){
  const shoulder=[side?.285:-.285,1.40,0],want=pose.hands[side],ik=twoBone(shoulder,want,.29,.29,[side?.62:-.62,1.07,-.1]);
  scene.rod(torso(shoulder),torso(ik.joint),.075,cloth,7,{},.060);scene.rod(torso(ik.joint),torso(ik.end),.062,skin,7,{},.042);
  scene.rod(torso(lerp(ik.joint,ik.end,.45)),torso(lerp(ik.joint,ik.end,.82)),.067,C.trim,6,{},.05);
  scene.ellipsoid(ik.end,[.055,.065,.050],skin,7,4,{},torso);hands.push(torso(ik.end));
  if(name==='Eleazar'&&side===0)for(let j=0;j<3;j++)scene.rod(torso(add(ik.end,[-.045,-.04+j*.025,0])),torso(add(ik.end,[.045,-.04+j*.025,0])),.009,'#4B3428',4);
 }
 const direction=d=>norm(sub(T(d),T([0,0,0])));
 const swordDir=direction(pose.sword),leftDir=direction(pose.sword2);
 if(pose.weapon){
  if(pose.spear){
   const d=direction(pose.sword),a=add(hands[0],mul(d,-1.0)),b=add(hands[0],mul(d,1.7));scene.rod(a,b,.022,'#71543A',7);blade(scene,b,d,'#C3C0AC',.33,.055,false);
  }else blade(scene,hands[0],swordDir,C.metal,name==='Shammah'?1.14:name==='Champion'?1.12:.82,name==='Champion'?.095:.060,name==='David');
 }
 if(pose.dagger)blade(scene,hands[1],leftDir,'#C2BCA1',.40,.040,false);
 if(pose.shield){shield(scene,add(hands[1],mul(direction([0,0,1]),.03)),direction([0,0,1]),C.trim,.32);}
 else if(name==='David'&&config.carryShield!==false)shield(scene,torso([0,1.17,-.235]),direction([0,0,-1]),C.trim,.30);
 return {root,head:headMap([0,1.68,.12]),hands,swordTip:add(hands[0],mul(swordDir,.82))};
}
const pDefault=()=>({height:.96,hands:[[-.25,1.17,.4],[.26,1.14,.32]],feet:[[-.16,0,.20],[.18,0,-.22]],sword:[0,.8,.6],sword2:[0,.8,.6],weapon:true,shield:true});
export function blade(scene,hand,d,color,length=.82,width=.06,curved=false){
 const side=norm(cross(d,Math.abs(d[1])>.9?[0,0,1]:[0,1,0]));
 scene.rod(add(hand,mul(d,-.13)),add(hand,mul(d,.035)),.024,'#342B23',6);
 scene.rod(add(hand,mul(side,-.105)),add(hand,mul(side,.105)),.018,'#B59F70',6,{metal:true});
 const points=[];
 for(let i=0;i<=8;i++){const u=i/8,curve=curved?Math.sin(u*Math.PI*.85)*.11:0,c=add(add(hand,mul(d,u*length+.045)),mul(side,curve));const w=width*(1-u*.65)*(i===8?.08:1);points.push([add(c,mul(side,w)),add(c,mul(side,-w))]);}
 for(let i=0;i<8;i++){scene.face([points[i][0],points[i+1][0],points[i+1][1],points[i][1]],color,{metal:true});scene.rod(points[i][0],points[i+1][0],.004,'#D8D3BA',3,{metal:true});}
}
export function shield(scene,center,normal,color,r=.32){
 const u=norm(cross(normal,[0,1,0])),v=norm(cross(normal,u));const pts=[];
 for(let i=0;i<14;i++){const a=i/14*TAU;pts.push(add(center,add(mul(u,Math.cos(a)*r),mul(v,Math.sin(a)*r*1.2))));}
 for(let i=0;i<14;i++){scene.face([add(center,mul(normal,.035)),pts[i],pts[(i+1)%14]],color);scene.rod(pts[i],pts[(i+1)%14],.016,'#9D8051',4,{metal:true});}
 scene.ellipsoid(add(center,mul(normal,.04)),[.065,.065,.065],'#A48B5F',8,4,{metal:true});
}
export function soldierLOD(scene,pos,yaw,time,seed=0){
 const T=p=>transform(p,pos,yaw);const stride=Math.sin(time*2+seed)*.18;
 scene.frustum([0,0,0],.55,1.35,.22,.14,.24,.15,seed%3?'#676B61':'#8B7557',T,0,4);
 scene.ellipsoid([0,1.52,0],[.14,.18,.14],'#8E8871',5,3,{metal:true},T);
 for(const s of [-1,1])scene.rod(T([s*.12,.65,0]),T([s*.14,0,s*stride]),.065,'#514737',4);
 scene.rod(T([.22,1.1,.1]),T([.30,2.05,.1]),.017,'#6D5940',4);
}
