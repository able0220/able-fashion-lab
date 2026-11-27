import {cape,fabric,studio,drawMannequin} from './art.js?v=1';
import {drawHair,mannequinFrame,NATURAL} from './hair.js?v=1';
const editorial='https://www.lorealparisusa.com/beauty-magazine/';
const lengthGuide=editorial+'hair-style/long-hairstyles/hair-length-chart';
const bobGuide=editorial+'hair-style/hairstyle-trends/ways-to-modernize-bob-haircut';
export const tips={
 '타원형':{feature:'이 앱의 분류 규칙에서 길이와 턱폭이 다른 네 유형의 경계에 걸리지 않은 경우예요.',short:'턱에 닿는 단발은 머리 끝과 턱선이 한곳에서 만나요.',medium:'어깨 쪽으로 길이를 내리면 얼굴 옆선이 어디까지 이어져 보이는지 비교해 보세요.',styles:['단발','중단발'],source:lengthGuide},
 '둥근형':{feature:'측정한 얼굴 길이에 비해 광대 사이의 폭이 비교적 넓게 나타났어요.',short:'턱 높이 단발에서 머리 끝이 볼과 턱 중 어디로 시선을 모으는지 보세요.',medium:'세로로 흐르는 선을 살리고 싶다면 어깨에 닿는 긴 단발을 대 보세요. 옆머리가 턱 아래까지 이어져요.',styles:['단발','중단발'],source:bobGuide},
 '긴형':{feature:'광대 사이의 폭에 비해 이마 위에서 턱끝까지의 길이가 길게 측정됐어요.',short:'단발과 앞머리를 번갈아 보세요. 앞머리가 이마를 덮으면 눈썹 위에 가로선이 생겨요.',medium:'중단발로 바꿔 머리 끝을 어깨 쪽으로 옮겨 보세요. 앞머리를 바꿨을 때와 길이를 바꿨을 때 어느 쪽 차이가 더 큰가요?',styles:['단발','중단발','시스루뱅'],source:bobGuide},
 '각진형':{feature:'광대 사이의 폭에 비해 턱 양쪽의 폭이 넓게 측정됐어요.',short:'끝이 안쪽으로 휘는 C컬 단발을 대고 턱의 직선 옆에 곡선이 생기는 모습을 보세요.',medium:'턱 아래로 내려오는 중단발이나 층을 낸 스타일은 머리 끝의 위치가 달라져요. 턱선을 강조하고 싶은지, 부드러운 흐름을 원하는지 비교해 보세요.',styles:['C컬 단발','중단발','레이어드컷'],source:lengthGuide},
 '하트형':{feature:'광대폭을 기준으로 비교했을 때 이마 쪽이 턱보다 넓게 측정됐어요.',short:'턱선에서 끝나는 단발은 머리의 부피를 턱 양옆에 놓을 수 있어요.',medium:'쇄골 쪽 중단발에 얼굴을 따라 내려오는 층을 주는 방법도 있어요. 머리 끝이 턱 옆에 있을 때와 아래에 있을 때를 비교해 보세요.',styles:['단발','중단발','레이어드컷'],source:editorial+'hair-style/hairstyle-trends/best-haircuts-for-heart-shaped-faces'}
};
// Every season lists the same eight roles in the same order, so index i compares "the same kind of colour" across seasons.
export const roles=['레드·핑크','오렌지·옐로','그린','블루','퍼플','다크 뉴트럴','라이트 뉴트럴','브라운·베이지'];
export const seasons=['봄 웜','여름 쿨','가을 웜','겨울 쿨'];
const named=[
 [['피치 코랄','#F7876F'],['애프리콧','#F7B26E'],['연두','#A6CF6C'],['터콰이즈','#3FBFB0'],['라이트 바이올렛','#A88BD0'],['라이트 네이비','#45629A'],['아이보리','#F7EDD6'],['카멜','#C99A5E']],
 [['로즈 핑크','#E39AB1'],['레몬 셔벗','#EEE59A'],['민트','#A3D6C4'],['파우더 블루','#9DBCE3'],['라벤더','#B9A6DB'],['그레이 네이비','#56627E'],['소프트 화이트','#F1F2F4'],['로즈 베이지','#CFB5A8']],
 [['테라코타','#B85C3C'],['머스터드','#C99A2E'],['올리브','#77783A'],['딥 틸','#2C6B69'],['플럼','#6E3B52'],['다크 브라운','#4A3022'],['웜 베이지','#D6BE98'],['카멜 브라운','#9C6B3E']],
 [['푸시아','#C8175E'],['아이시 옐로','#F5F3B5'],['에메랄드','#008F6E'],['로열 블루','#1E4FAF'],['로열 퍼플','#5D2F91'],['블랙','#17171A'],['퓨어 화이트','#FAFBFC'],['쿨 토프','#8A7F7D']]];
export const palettes=named.map(p=>p.map(([,h])=>h));
export function colorInfo(hex){
 const h=(hex||'').toUpperCase();
 for(let s=0;s<named.length;s++)for(let i=0;i<named[s].length;i++)if(named[s][i][1]===h)return{name:named[s][i][0],season:seasons[s],role:roles[i],s,i};
 return{name:h,season:'',role:'',s:-1,i:-1};
}
const edge=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
function portrait(c,img,face,w,h,color){
 const pts=face.p,chin=pts[152],forehead=pts[10];
 const faceHeight=Math.max(1,chin.y-forehead.y);
 const centerX=(pts[234].x+pts[454].x)/2;
 const zoom=Math.min(w*.38/face.g.width,h*.36/faceHeight);
 // Keep the framing identical for every panel. Where the source ends, use a neutral matte.
 const x=Math.min(Math.max(w/2+zoom*centerX,w),Math.max(w,zoom*img.width));
 const centeredX=zoom*img.width<w?(w+zoom*img.width)/2:x;
 const y=h*.22-zoom*forehead.y;
 const top=zoom*img.height<h?Math.max(0,Math.min(h-zoom*img.height,y)):Math.max(h-zoom*img.height,Math.min(0,y));
 c.fillStyle='#d8d8d2';c.fillRect(0,0,w,h);
 c.save();c.translate(centeredX,top);c.scale(-zoom,zoom);c.drawImage(img,0,0);c.restore();
 const neckX=centeredX-zoom*chin.x,neckY=top+zoom*chin.y+faceHeight*zoom*.10;
 cape(c,neckX,neckY,zoom*face.g.width,w,h,color);
}
function closeUp(c,img,face,w,h,color){
 fabric(c,()=>{c.beginPath();c.rect(0,0,w,h)},color,w/2,h*.86,w,h);
 const pts=face.p,midX=(pts[234].x+pts[454].x)/2,midY=(pts[10].y+pts[152].y)/2;
 const zoom=Math.min(w*.72/face.g.width,h*.71/Math.max(1,pts[152].y-pts[10].y));
 const outline=()=>{c.beginPath();edge.forEach((id,j)=>{const p=pts[id];j?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.closePath()};
 c.save();c.translate(w/2,h*.46);c.scale(-zoom,zoom);c.translate(-midX,-midY);
 c.save();c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=24;c.fillStyle=color;outline();c.fill();c.restore();
 outline();c.clip();c.drawImage(img,0,0);c.restore();
}
function placeholder(c,w,h,color){
 studio(c,w,h);
 const fw=Math.min(w*.2,h*.2),F=mannequinFrame(w/2,h*.12+.43*fw,fw);
 drawMannequin(c,F);drawHair(c,F,1,NATURAL);
 cape(c,w/2,F.o.y+(1.34+.16)*fw,fw,w,h,color);
 c.fillStyle='rgba(255,255,255,.88)';c.font='13px "Malgun Gothic",sans-serif';c.textAlign='center';c.fillText('웹캠을 켜면 내 얼굴로 비교합니다',w/2,h-18);c.textAlign='left';
}
function label(c,tag,color){
 const info=colorInfo(color),t1=(tag?tag+'  ':'')+info.name,t2=color.toUpperCase()+(info.season?'  ·  '+info.season:'');
 c.save();c.font='bold 16px "Malgun Gothic",sans-serif';const w1=c.measureText(t1).width;c.font='12px "Malgun Gothic",sans-serif';const w2=c.measureText(t2).width;
 const bw=Math.max(w1,w2)+64,bh=50;
 c.shadowColor='rgba(0,0,0,.2)';c.shadowBlur=12;c.shadowOffsetY=2;c.fillStyle='rgba(255,255,255,.94)';c.beginPath();c.roundRect(14,14,bw,bh,25);c.fill();
 c.shadowColor='transparent';c.fillStyle=color;c.beginPath();c.arc(39,39,14,0,7);c.fill();c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=1;c.stroke();
 c.fillStyle='#23211d';c.font='bold 16px "Malgun Gothic",sans-serif';c.fillText(t1,62,36);c.fillStyle='#77706a';c.font='12px "Malgun Gothic",sans-serif';c.fillText(t2,62,54);
 c.restore();
}
// colors: 1 = one large panel, 2 = A/B side by side, 4 = 2×2 season grid.
export function paintDrapes(canvas,img,face,colors,framing="portrait"){
 const W=960,H=550;
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
 const c=canvas.getContext('2d'),n=colors.length,cols=n===4?2:n,rows=n===4?2:1,pw=W/cols,ph=H/rows;
 colors.forEach((color,index)=>{
  const col=index%cols,row=Math.floor(index/cols);
  c.save();c.translate(col*pw,row*ph);c.beginPath();c.rect(0,0,pw,ph);c.clip();
  if(img&&face&&framing==="portrait")portrait(c,img,face,pw,ph,color);
  else if(img&&face)closeUp(c,img,face,pw,ph,color);
  else placeholder(c,pw,ph,color);
  label(c,n===2?(index?'B':'A'):n===4?'':'B',color);
  c.fillStyle='#fff';if(col)c.fillRect(0,0,3,ph);if(row)c.fillRect(0,0,pw,3);
  c.restore();
 });
}
