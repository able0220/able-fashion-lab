// Shared canvas rendering: fabric drapes, studio backdrop and a neutral mannequin bust.
let grainCanvas=null;
function grain(c){
 if(!grainCanvas){
  grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=96;
  const g=grainCanvas.getContext('2d'),d=g.createImageData(96,96);let s=7;
  for(let i=0;i<d.data.length;i+=4){s=(s*16807)%2147483647;const y=(i>>2)/96|0,weave=(y%2?6:-6)*(((i>>2)%4)<2?1:-1),v=128+(s%30)-15+weave;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}
  g.putImageData(d,0,0);
 }
 return c.createPattern(grainCanvas,'repeat');
}
// Draws only the blurred shadow of a stroke, which gives soft fold lines without hard edges.
export function softStroke(c,path,color,width,blur){
 c.save();c.translate(-5000,0);c.shadowOffsetX=5000;c.shadowColor=color;c.shadowBlur=blur;c.strokeStyle='#000';c.lineWidth=width;c.lineCap='round';path();c.stroke();c.restore();
}
export function studio(c,w,h){
 const g=c.createRadialGradient(w*.5,h*.38,0,w*.5,h*.5,Math.max(w,h)*.75);
 g.addColorStop(0,'#f6f4ef');g.addColorStop(.6,'#e5e2da');g.addColorStop(1,'#cfcbc1');
 c.fillStyle=g;c.fillRect(0,0,w,h);
}
// Cape outline used for both the webcam portrait and the mannequin.
function capeOutline(c,x,y,width,w,h,open=false){
 // The cape drops over the shoulders, then reaches the panel edge no lower than the shoulder line.
 const end=Math.min(h*.9,y+width*.85);
 c.beginPath();c.moveTo(0,end);
 c.bezierCurveTo(x-width*1.12,y+width*.22,x-width*.46,y+width*.14,x-width*.35,y);
 c.quadraticCurveTo(x,y+width*.19,x+width*.35,y);
 c.bezierCurveTo(x+width*.46,y+width*.14,x+width*1.12,y+width*.22,w,end);
 if(!open){c.lineTo(w,h);c.lineTo(0,h);c.closePath()}
}
export function fabric(c,clip,color,ax,ay,W,H){
 c.save();clip();c.clip();
 c.fillStyle=color;c.fillRect(0,0,W,H);
 let g=c.createLinearGradient(0,ay,0,H);g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(.3,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.2)');c.fillStyle=g;c.fillRect(0,0,W,H);
 const r=c.createRadialGradient(ax,ay,W*.1,ax,ay,W*.8);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(.55,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,.2)');c.fillStyle=r;c.fillRect(0,0,W,H);
 // Folds fall from the neckline and fan out over the shoulders.
 [-.92,-.68,-.47,-.29,-.12,.07,.25,.44,.66,.9].forEach((f,i)=>{
  const sx=ax+f*W*.07,sy=ay+W*.02,mx=ax+f*W*.24,my=ay+(H-ay)*.45,ex=ax+f*W*.62,ey=H+W*.05;
  const path=()=>{c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(mx,my,ex,ey)};
  softStroke(c,path,'rgba(0,0,0,'+(i%3?.17:.24)+')',W*.016,W*.028);
  c.save();c.translate(W*.014*(f<0?-1:1),0);softStroke(c,path,'rgba(255,255,255,'+(i%2?.12:.18)+')',W*.007,W*.018);c.restore();
 });
 c.globalCompositeOperation='overlay';c.globalAlpha=.22;c.fillStyle=grain(c);c.fillRect(0,0,W,H);
 c.restore();
}
// A neckline cape in the given colour, with a soft contact shadow on the neck and a rolled edge.
export function cape(c,x,y,width,w,h,color){
 softStroke(c,()=>capeOutline(c,x,y-width*.015,width,w,h,true),'rgba(40,25,15,.4)',width*.03,width*.08);
 fabric(c,()=>capeOutline(c,x,y,width,w,h),color,x,y,w,h);
 c.save();capeOutline(c,x,y,width,w,h);c.clip();
 capeOutline(c,x,y,width,w,h,true);c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=Math.max(1.5,width*.012);c.stroke();
 c.translate(0,width*.035);softStroke(c,()=>capeOutline(c,x,y,width,w,h,true),'rgba(0,0,0,.28)',width*.03,width*.05);
 c.restore();
}
// Neutral mannequin bust drawn in face-local coordinates (see hair.js mannequinFrame).
export function drawMannequin(c,F){
 const ch=F.chains[0];
 c.save();c.translate(F.o.x,F.o.y);c.rotate(F.roll);c.scale(F.w,F.w);
 let g=c.createLinearGradient(0,.9,0,2.6);g.addColorStop(0,'#cdb8a6');g.addColorStop(.35,'#e2d2c3');g.addColorStop(1,'#d4c1b0');
 c.fillStyle=g;c.beginPath();c.moveTo(-.26,.9);c.bezierCurveTo(-.26,1.45,-.3,1.72,-.56,1.88);c.bezierCurveTo(-.98,2,-1.38,2.1,-1.52,2.7);c.lineTo(1.52,2.7);c.bezierCurveTo(1.38,2.1,.98,2,.56,1.88);c.bezierCurveTo(.3,1.72,.26,1.45,.26,.9);c.closePath();c.fill();
 c.save();c.shadowColor='rgba(70,45,30,.45)';c.shadowBlur=F.w*.12;c.shadowOffsetY=F.w*.06;c.fillStyle='rgba(120,90,70,.35)';c.beginPath();c.ellipse(0,1.18,.28,.12,0,0,7);c.fill();c.restore();
 c.fillStyle='#d2bba8';for(const s of [-1,1]){c.beginPath();c.ellipse(s*.5,.62,.075,.15,s*.12,0,7);c.fill()}
 c.beginPath();for(let a=Math.PI;a<=2*Math.PI+1e-6;a+=Math.PI/24)c.lineTo(.54*Math.cos(a),.42+.84*Math.sin(a));
 for(let k=8;k<ch.length;k++)c.lineTo(ch[k].x,ch[k].y);c.lineTo(0,1.34);for(let k=ch.length-1;k>=8;k--)c.lineTo(-ch[k].x,ch[k].y);c.closePath();
 g=c.createRadialGradient(-.16,.28,.05,0,.45,1.05);g.addColorStop(0,'#f6ece3');g.addColorStop(.55,'#e6d6c7');g.addColorStop(1,'#c8b19e');c.fillStyle=g;c.fill();
 c.lineCap='round';c.strokeStyle='rgba(110,80,62,.32)';c.lineWidth=.014;
 for(const s of [-1,1]){c.beginPath();c.moveTo(s*.1,.57);c.quadraticCurveTo(s*.19,.61,s*.28,.56);c.stroke()}
 c.strokeStyle='rgba(110,80,62,.2)';c.lineWidth=.02;for(const s of [-1,1]){c.beginPath();c.moveTo(s*.08,.44);c.quadraticCurveTo(s*.19,.4,s*.3,.45);c.stroke()}
 c.lineWidth=.012;c.beginPath();c.moveTo(.03,.62);c.quadraticCurveTo(.07,.8,.06,.86);c.quadraticCurveTo(.01,.9,-.05,.87);c.stroke();
 c.fillStyle='rgba(176,112,100,.35)';c.beginPath();c.ellipse(0,1.04,.1,.028,0,0,7);c.fill();
 c.restore();
}
