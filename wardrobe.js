export const tops=['기본 티셔츠','오버핏 티셔츠','크롭','셔츠','니트','후드','재킷','블레이저'],bottoms=['슬림핏','스트레이트','와이드팬츠','부츠컷','카고팬츠','데님','스커트'];
export const initial=()=>({form:'여성형',height:172,weight:60,shoulder:100,waist:100,hip:100,torso:100,arm:100,leg:100,top:tops[0],bottom:bottoms[1],upper:'#9caea1',lower:'#454b59',angle:0,zoom:1});
export function drawModel(c,s){
 const W=c.canvas.width,H=c.canvas.height;c.clearRect(0,0,W,H);
 let bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#f2ede0');bg.addColorStop(1,'#d1d6c8');c.fillStyle=bg;c.fillRect(0,0,W,H);
 const scale=H*.00475*s.zoom*(s.height/172),ang=s.angle*Math.PI/180,faces=[];
 const project=([x,y,z])=>{let depth=z*Math.cos(ang)-x*Math.sin(ang);return [W/2+scale*(x*Math.cos(ang)+z*Math.sin(ang)),H*.51-scale*(y-.05*depth),depth]};
 const shade=(color,k)=>'rgb('+color.match(/\w\w/g).map(n=>Math.round(Math.min(255,parseInt(n,16)*k))).join(',')+')';
 function polygon(vertices,col,k=1){const ps=vertices.map(project);faces.push({ps,z:ps.reduce((a,p)=>a+p[2],0)/ps.length,color:shade(col,k)})}
 // Closed elliptical cross-sections form the body and the individual garments.
 function tube(rows,color,trim=false){const N=28;const rings=rows.map(([y,x,z,rx,rz])=>Array.from({length:N},(_,i)=>{let a=i*2*Math.PI/N;return [x+rx*Math.cos(a),y,z+rz*Math.sin(a)]}));
 for(let j=1;j<rings.length;j++)for(let i=0;i<N;i++){let n=(i+1)%N,a=(i+.5)*2*Math.PI/N+ang,k=.85+.13*Math.sin(a)+.13*Math.cos(a);polygon([rings[j-1][i],rings[j-1][n],rings[j][n],rings[j][i]],color,k*(trim&&j===1?.83:1))}polygon(rings.at(-1),color,.96);polygon(rings[0],color,.86)}
 const row=(y,rx,rz,x=0,z=0)=>[y,x,z,rx,rz],skin='#c9ad93',shoe='#ece6d9';
 let mass=.86+(s.weight-40)*.007,sh=20*mass*s.shoulder/100*(s.form==='남성형'?1.1:1),wa=14*mass*s.waist/100,hip=17*mass*s.hip/100*(s.form==='여성형'?1.08:1),chest=42*s.torso/100,leg=67*s.leg/100,hem=-leg,top=s.top,bt=s.bottom;
 c.fillStyle='#42503d29';c.beginPath();c.ellipse(W/2,H*.51+scale*(leg+6),scale*31,scale*3,0,0,2*Math.PI);c.fill();
 tube([row(chest+2,6,6),row(chest+12,5,5)],skin);
 tube([row(chest+8,3,5),row(chest+11,7,7),row(chest+19,9,9),row(chest+28,8.2,8.4),row(chest+32,4,5),row(chest+33,1,1)],skin);
 tube([row(-7,hip*.91,9),row(8,wa,8),row(chest*.8,sh*.91,10),row(chest,sh*.88,8)],skin);
 for(let side of [-1,1]){
 const x=side*hip*.52,knee=-leg*.54,ankle=hem+3;
 tube([row(ankle,3,3,x),row(knee,4.5,5,x),row(-5,hip*.45,8,x)],skin);
 tube([row(hem-4,5,9,x,3),row(hem-1,5.3,9.3,x,3),row(ankle+2,4,5,x)],shoe,true);
 if(bt!=='스커트'){let widths=({'슬림핏':[3.8,5],'스트레이트':[6.8,7],'와이드팬츠':[9.5,9.2],'부츠컷':[9,5],'카고팬츠':[7.5,8],'데님':[6,6.7]})[bt];
 tube([row(ankle,widths[0],widths[0]*.87,x),row(ankle+1.4,widths[0],widths[0]*.87,x),row(knee,widths[1],6,x),row(-7,hip*.53,9,x),row(1,hip*.46,8,x)],s.lower,true);
 if(bt==='카고팬츠')tube([row(knee+6,3,5,x+side*5,4),row(knee+14,3.4,5,x+side*5,4)],s.lower,true)}
 const armEnd=chest-48*s.arm/100,hand=side*(sh+7);
 tube([row(armEnd-6,2.6,3,hand),row(armEnd,3.4,3.4,hand),row(chest*.44,4,4,side*(sh+5)),row(chest-3,5.4,5.4,side*(sh-2))],skin);
 const short=tops.indexOf(top)<3||top==='셔츠',sleeveY=short?chest-(top==='오버핏 티셔츠'?21:14):armEnd+2;
 tube([row(sleeveY,short?6.1:4.4,short?6.5:4.4,side*(sh+(short?2:6))),row(sleeveY+2,short?6.2:4.6,short?6.5:4.5,side*(sh+(short?2:6))),row(chest-5,6,7,side*(sh-2)),row(chest-1,4,6,side*(sh-3))],s.upper,true)}
 tube([row(bt==='스커트'?-28:-8,bt==='스커트'?hip*1.43:hip*1.04,bt==='스커트'?14:10),row(-2,hip*1.05,10),row(3,wa*1.08,9)],s.lower,true);
 const loose=top==='오버핏 티셔츠'||top==='후드',bottomY=top==='크롭'?10:loose?-9:-4;
 tube([row(bottomY,loose?sh*1.08:hip*1.05,11),row(bottomY+2,loose?sh*1.08:hip*1.05,11),row(chest*.48,loose?sh:wa*1.15,10),row(chest*.85,sh*1.04,11),row(chest,sh*.86,8),row(chest+2,7,6)],s.upper,true);
 if(top==='후드')tube([row(chest-8,11,7,0,-7),row(chest+4,10,9,0,-6),row(chest+7,7,7,0,-5)],s.upper);
 if(['블레이저','셔츠','재킷'].includes(top)){for(let d of [-1,1])polygon([[0,chest+1,7],[d*7,chest+2,6],[d*10,chest-5,10],[d*3,chest-14,11.3]],s.upper,.73);for(let y=chest-16;y>bottomY+2;y-=6)tube([row(y,.85,.85,0,11),row(y+1,.85,.85,0,11)],'#50504b')}
 if(top==='니트'){for(let y=bottomY+3;y<chest*.42;y+=2)tube([row(y,hip*1.045,11.1),row(y+.55,hip*1.045,11.1)],s.upper,true)}
 faces.sort((a,b)=>a.z-b.z);for(const f of faces){c.beginPath();f.ps.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=f.color;c.fill();c.strokeStyle=f.color;c.lineWidth=.55;c.stroke()}
}

