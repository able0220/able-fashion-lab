// Strand-based 2D hairstyles anchored to face landmarks.
// Geometry lives in face-local units: origin at landmark 10 (top of forehead), x along the eye line,
// one unit = cheek-to-cheek face width. The same code draws on a webcam face or on the mannequin.
const SIDE_A=[10,338,297,332,284,251,389,356,454,323,361,288,397,365],SIDE_B=[10,109,67,103,54,21,162,127,234,93,132,58,172,136];
export const hairNames=['원래 머리','단발','C컬 단발','중단발','긴 생머리','긴 웨이브','레이어드컷','시스루뱅','커튼뱅'];
export const NATURAL='#3a2a22';
// len: tip below chin · vol: extra width · wave: amplitude/frequency · curl: inward tip · layer: face-framing layers
const STYLES=[null,
 {len:.03,vol:.02,wave:0,freq:1,curl:.02,layer:0},
 {len:.05,vol:.05,wave:0,freq:1,curl:.1,layer:0},
 {len:.5,vol:.03,wave:.012,freq:1.5,curl:.035,layer:.15},
 {len:1.3,vol:0,wave:.006,freq:2,curl:0,layer:0},
 {len:1.3,vol:.07,wave:.05,freq:3.2,curl:0,layer:.12},
 {len:.95,vol:.04,wave:.018,freq:2,curl:.03,layer:.6},
 {len:.55,vol:.02,wave:.01,freq:1.5,curl:.035,layer:.12,bangs:'see'},
 {len:.8,vol:.03,wave:.016,freq:2,curl:.025,layer:.35,bangs:'curtain'}];
const clamp01=v=>v<0?0:v>1?1:v,smooth=(a,b,v)=>{v=clamp01((v-a)/(b-a));return v*v*(3-2*v)};
function rng(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const toRGB=h=>h.match(/\w\w/g).map(s=>parseInt(s,16));
function tone(rgb,k,a=1){const c=k<=1?rgb.map(v=>v*k):rgb.map(v=>v+(255-v)*(k-1)*.55);return 'rgba('+c.map(v=>Math.round(Math.max(0,Math.min(255,v)))).join(',')+','+a+')'}
function spline(pts,n){
 const dense=[];
 for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
  for(let s=0;s<12;s++){const t=s/12,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(c-a)*t+(2*a-5*b+4*c-d)*t2+(3*b-a-3*c+d)*t3);dense.push({x:f(p0.x,p1.x,p2.x,p3.x),y:f(p0.y,p1.y,p2.y,p3.y)})}}
 dense.push({...pts.at(-1)});
 const L=[0];for(let i=1;i<dense.length;i++)L.push(L[i-1]+Math.hypot(dense[i].x-dense[i-1].x,dense[i].y-dense[i-1].y));
 const out=[];let j=0;
 for(let k=0;k<=n;k++){const target=L.at(-1)*k/n;while(j<L.length-2&&L[j+1]<target)j++;const t=(target-L[j])/((L[j+1]-L[j])||1);out.push({x:dense[j].x+(dense[j+1].x-dense[j].x)*t,y:dense[j].y+(dense[j+1].y-dense[j].y)*t})}
 return out;
}
export function faceFrame(f){
 const p=f.p,o=p[10],r=f.g.roll,w=f.g.width,cs=Math.cos(r),sn=Math.sin(r);
 const L=q=>{const dx=q.x-o.x,dy=q.y-o.y;return{x:(dx*cs+dy*sn)/w,y:(-dx*sn+dy*cs)/w}};
 return{o,roll:r,w,chains:[SIDE_A.map(i=>L(p[i])),SIDE_B.map(i=>L(p[i]))],chinY:L(p[152]).y,browY:(L(p[105]).y+L(p[334]).y)/2};
}
const TH=[0,14,26,37,48,58,68,80,90,102,115,128,140,152].map(d=>d*Math.PI/180);
function egg(th){let x=Math.sin(th)*.5,y=.66-Math.cos(th)*.68;if(y>.66)x*=1-.3*((y-.66)/.68)**2;return{x,y}}
export function mannequinFrame(x,y,w){const a=TH.map(egg);return{o:{x,y},roll:0,w,chains:[a,a.map(q=>({x:-q.x,y:q.y}))],chinY:1.34,browY:.4}}

function side(ch,F,S){
 const s=Math.sign(ch[8].x)||1,chin=F.chinY,tip=chin+S.len,part=S.bangs==='curtain'?0:-.07,v=S.vol;
 const C={x:0,y:chin*.5},off=(q,m)=>{const dx=q.x-C.x,dy=q.y-C.y,l=Math.hypot(dx,dy)||1;return{x:q.x+dx/l*m,y:q.y+dy/l*m}};
 const top=[{x:part,y:-.03},...ch.slice(1,9).map(q=>off(q,.025))],ear=top.at(-1),low=[ear];
 for(let j=9;j<13;j++){const q=off(ch[j],.025+.008*(j-9));if(q.y<tip-.06)low.push(q)}
 const jaw=low.at(-1),ix=y=>jaw.x+s*(.05*clamp01((y-jaw.y)/.5)+.11*clamp01((y-chin-.2)/.5));
 for(let y=jaw.y+.25;y<tip-.08;y+=.25)low.push({x:ix(y),y});low.push({x:ix(tip),y:tip});
 const ox=y=>s*(.665+v+(S.len>.3?.08*clamp01((y-chin-.05)/.45):-.025*clamp01((y-.8)/.45)));
 // Dome over the skull: an elliptical arc from the parting down to ear level.
 const otop=[{x:part,y:-.56-v}];for(const deg of [64,40,18])otop.push({x:s*(.65+v)*Math.cos(deg*Math.PI/180),y:.2-(.76+v)*Math.sin(deg*Math.PI/180)});
 otop.push({x:ox(ear.y),y:ear.y});const olow=[{x:ox(ear.y),y:ear.y}];
 for(let y=ear.y+.25;y<tip-.08;y+=.25)olow.push({x:ox(y),y});olow.push({x:ox(tip),y:tip});
 const M1=22,M2=Math.round(18+26*Math.min(1.6,tip-ear.y)),N=M1+M2;
 const I=[...spline(top,M1),...spline(low,M2).slice(1)],O=[...spline(otop,M1),...spline(olow,M2).slice(1)];
 for(let k=0;k<=N;k++){const tb=k<=M1?0:(k-M1)/M2,dx=s*S.wave*Math.sin(2*Math.PI*S.freq*tb+.6)*smooth(0,.2,tb)-s*S.curl*smooth(.72,1,tb),dy=-S.curl*.5*smooth(.85,1,tb);for(const P of [I,O]){P[k].x+=dx;P[k].y+=dy}}
 const tipK=u=>Math.round(N-S.layer*M2*Math.pow(1-clamp01(u),1.3)),at=(k,u)=>({x:I[k].x+(O[k].x-I[k].x)*u,y:I[k].y+(O[k].y-I[k].y)*u});
 const poly=O.slice(0,N+1);for(let i=10;i>=0;i--)poly.push(at(tipK(i/10),i/10));for(let k=tipK(0);k>=0;k--)poly.push(I[k]);
 return{s,I,O,N,M1,M2,tipK,at,poly};
}
const qp=(a,b,c,t)=>({x:(1-t)*(1-t)*a.x+2*(1-t)*t*b.x+t*t*c.x,y:(1-t)*(1-t)*a.y+2*(1-t)*t*b.y+t*t*c.y});
function strand(c,a,b,e){c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(b.x,b.y,e.x,e.y);c.stroke()}

export function drawHair(c,F,style,color){
 const S=STYLES[style];if(!S)return;
 const base=toRGB(color||NATURAL),R=rng(style*977+13),sides=F.chains.map(ch=>side(ch,F,S));
 const path=pts=>{pts.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath()};
 c.save();c.translate(F.o.x,F.o.y);c.rotate(F.roll);c.scale(F.w,F.w);c.lineCap='round';c.lineJoin='round';
 // 1. Under-layer with a soft cast shadow on the face and neck.
 c.save();c.shadowColor='rgba(25,15,10,.35)';c.shadowBlur=F.w*.05;c.shadowOffsetY=F.w*.012;c.fillStyle=tone(base,.72);
 for(const g of sides){c.beginPath();path(g.poly);c.fill()}c.restore();
 // 2. Strands follow the space between the hairline and the outer silhouette, grouped into clumps.
 for(const g of sides){
  const count=Math.round(150+g.N*4);
  for(let n=0;n<count;n++){
   const clump=Math.floor(R()*9),u=clamp01(R()<.65?(clump+.5)/9+(R()-.5)*.09:R()),r=R();
   const k=r<.15?.6:r<.5?.8:r<.85?.95:r<.96?1.12:1.3,end=Math.max(4,g.tipK(u)-Math.floor(R()*4)),jit=(R()-.5)*.014,ph=R()*6;
   c.strokeStyle=tone(base,k,.3+R()*.35);c.lineWidth=.004+R()*.006;c.beginPath();
   for(let i=0;i<=end;i++){const q=g.at(i,u),tb=i<=g.M1?0:(i-g.M1)/g.M2,x=q.x+jit*tb*g.s+.004*Math.sin(ph+i*.35);i?c.lineTo(x,q.y):c.moveTo(x,q.y)}
   c.stroke();
  }
 }
 // 3. Crown sheen and root depth, clipped to the hair.
 c.save();c.beginPath();for(const g of sides)path(g.poly);c.clip();
 const sheen=c.createRadialGradient(0,.42,.5,0,.42,.9);sheen.addColorStop(0,'rgba(255,255,255,0)');sheen.addColorStop(.38,tone(base,1.9,.3));sheen.addColorStop(.62,'rgba(255,255,255,0)');sheen.addColorStop(1,'rgba(255,255,255,0)');
 c.globalCompositeOperation='screen';c.fillStyle=sheen;c.fillRect(-2,-1,4,5);
 c.globalCompositeOperation='multiply';for(const g of sides){c.beginPath();g.I.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.strokeStyle='rgba(40,25,20,.16)';c.lineWidth=.035;c.stroke()}
 c.restore();
 // 4. A few loose strands soften the outer edge.
 for(const g of sides)for(let n=0;n<22;n++){const u=1+R()*.05,from=Math.floor(R()*g.N*.4),to=Math.min(g.tipK(1),from+8+Math.floor(R()*g.N*.5));c.strokeStyle=tone(base,.85,.3);c.lineWidth=.002;c.beginPath();for(let i=from;i<=to;i++){const q=g.at(i,u);i>from?c.lineTo(q.x+.01*Math.sin(i*.4+n),q.y):c.moveTo(q.x,q.y)}c.stroke()}
 // 5. Bangs.
 const by=F.browY;
 if(S.bangs==='see'){
  // Thin, separated wisps rooted inside the crown so the forehead shows between clumps.
  c.save();c.shadowColor='rgba(25,15,10,.3)';c.shadowBlur=F.w*.012;c.shadowOffsetY=F.w*.004;
  for(let n=0,drawn=0;n<900&&drawn<330;n++){const x0=(R()*2-1)*.35;if(R()>.35+.65*Math.sin(x0*41+1.3)**2)continue;drawn++;const e=Math.abs(x0)/.36,sweep=(R()-.5)*.03;
   c.strokeStyle=tone(base,[.5,.7,.9,1.1,1.35][Math.floor(R()*5)],.2+R()*.35);c.lineWidth=.0018+R()*.0032;
   strand(c,{x:x0*.45,y:-.26},{x:x0*1.04+sweep*.5,y:by*.2},{x:x0*.98+sweep,y:by-.005-.05*e*e-R()*.05})}
  c.restore();
 }else if(S.bangs==='curtain'){
  for(const s of [-1,1]){
   const curve=v=>[{x:s*(.02+.05*v),y:-.24},{x:s*(.06+.32*v),y:by*(.75-.55*v)},{x:s*(.27+.29*v),y:by+.06+.3*v}];
   const inner=curve(0),outer=curve(1);
   c.save();c.shadowColor='rgba(25,15,10,.28)';c.shadowBlur=F.w*.035;c.shadowOffsetY=F.w*.008;c.fillStyle=tone(base,.75);c.beginPath();
   for(let t=0;t<=1.001;t+=.1){const q=qp(...outer,t);t?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)}for(let t=1;t>=-.001;t-=.1){const q=qp(...inner,t);c.lineTo(q.x,q.y)}c.fill();c.restore();
   for(let n=0;n<170;n++){const v=clamp01(R()*1.05),[a,b,e]=curve(v);c.strokeStyle=tone(base,[.5,.75,.95,1.25,1.45][Math.floor(R()*5)],.4+R()*.4);c.lineWidth=.003+R()*.005;strand(c,a,b,{x:e.x+(R()-.5)*.03,y:e.y-R()*.08})}
  }
 }
 c.restore();
}
