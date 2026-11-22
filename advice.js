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
const edge=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
function portrait(c,img,face,w,h,color){
 const pts=face.p,chin=pts[152],forehead=pts[10];
 const faceHeight=Math.max(1,chin.y-forehead.y);
 const centerX=(pts[234].x+pts[454].x)/2;
 const zoom=Math.min(w*.38/face.g.width,h*.36/faceHeight);
 // Keep the framing identical for A and B. Where the source ends, use a neutral matte.
 const x=Math.min(Math.max(w/2+zoom*centerX,w),Math.max(w,zoom*img.width));
 const centeredX=zoom*img.width<w?(w+zoom*img.width)/2:x;
 const y=h*.22-zoom*forehead.y;
 const top=zoom*img.height<h?Math.max(0,Math.min(h-zoom*img.height,y)):Math.max(h-zoom*img.height,Math.min(0,y));
 c.fillStyle='#d8d8d2';c.fillRect(0,0,w,h);
 c.save();c.translate(centeredX,top);c.scale(-zoom,zoom);c.drawImage(img,0,0);c.restore();
 const neckX=centeredX-zoom*chin.x,neckY=top+zoom*chin.y+faceHeight*zoom*.10;
 const width=zoom*face.g.width;
 // A narrow neckline opens onto the shoulders; side hair remains in the camera view.
 c.save();c.beginPath();c.moveTo(neckX-width*.35,neckY);
 c.quadraticCurveTo(neckX,neckY+width*.19,neckX+width*.35,neckY);
 c.bezierCurveTo(neckX+width*.46,neckY+width*.18,neckX+width*1.12,neckY+width*.26,w,h*.90);
 c.lineTo(w,h);c.lineTo(0,h);c.lineTo(0,h*.90);
 c.bezierCurveTo(neckX-width*1.12,neckY+width*.26,neckX-width*.46,neckY+width*.18,neckX-width*.35,neckY);
 c.clip();c.fillStyle=color;c.fillRect(0,0,w,h);
 const folds=c.createLinearGradient(0,0,w,h*.19);
 for(const [at,alpha] of [[0,.12],[.18,0],[.32,.09],[.46,0],[.68,.11],[.86,0],[1,.12]])folds.addColorStop(at,'rgba(0,0,0,'+alpha+')');
 c.fillStyle=folds;c.fillRect(0,0,w,h);c.restore();
}
export function paintDrapes(canvas,img,face,colors,framing="portrait"){
 const W=960,H=550;
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
 const c=canvas.getContext('2d'),panelWidth=W/colors.length;
 colors.forEach((color,index)=>{
  c.save();c.translate(index*panelWidth,0);c.beginPath();c.rect(0,0,panelWidth,H);c.clip();
  c.fillStyle=color;c.fillRect(0,0,panelWidth,H);
  // Broad, low-contrast folds keep the chosen swatch visible beside both cheeks.
  let folds=c.createLinearGradient(0,H*.65,panelWidth,H);
  for(const [t,v] of [[0,.10],[.21,0],[.32,.08],[.43,0],[.66,.09],[.82,0],[1,.1]])folds.addColorStop(t,'rgba(0,0,0,'+v+')');
  c.fillStyle=folds;c.fillRect(0,H*.77,panelWidth,H*.23);
  const cx=panelWidth/2,cy=H*.46;
  if(img&&face&&framing==="portrait"){
   portrait(c,img,face,panelWidth,H,color);
  }else if(img&&face){
   const pts=face.p,midX=(pts[234].x+pts[454].x)/2,midY=(pts[10].y+pts[152].y)/2;
   const zoom=Math.min(panelWidth*.72/face.g.width,H*.71/Math.max(1,pts[152].y-pts[10].y));
   c.save();c.translate(cx,cy);c.scale(-zoom,zoom);c.translate(-midX,-midY);
   c.beginPath();edge.forEach((id,j)=>{const p=pts[id];j?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.closePath();c.clip();c.drawImage(img,0,0);c.restore();
  }else{
   c.fillStyle='#d8af91';c.beginPath();c.ellipse(cx,cy,Math.min(panelWidth*.25,105),143,0,0,Math.PI*2);c.fill();
   c.fillStyle='#302d2a';c.font='bold 18px sans-serif';c.textAlign='center';c.fillText('동일한 기준색',cx,cy+6);
  }
  const label=(colors.length===2&&index===0?'A':'B')+'   '+color;
  c.fillStyle='#242724';c.fillRect(16,16,148,38);c.fillStyle='white';c.font='bold 20px sans-serif';c.textAlign='left';c.fillText(label,29,42);
  if(index){c.fillStyle='#fff';c.fillRect(0,0,3,H)}c.restore()
 })
}
