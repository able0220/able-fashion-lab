import {tips,paintDrapes,seasons,palettes,colorInfo} from './advice.js?v=5';
import {hex,lab,startVision,stopVision,capture,drawTracking,colorHair,loadHair,loadFace} from './vision.js?v=3';
import {initial,tops,bottoms,drawModel} from './wardrobe.js';
import {hairNames,drawHair,faceFrame,mannequinFrame,NATURAL} from './hair.js?v=1';
import {studio,drawMannequin} from './art.js?v=1';
const $=id=>document.getElementById(id),screen=$('screen'),ctx=screen.getContext('2d'),video=$('video'),panel=$('controls');
const names=['얼굴 분석','퍼스널 컬러','헤어 디자인','패션 스타일링','디지털 룩북'],en=['FACE ANALYSIS','COLOR DRAPING','HAIR DESIGN','FASHION STUDIO','STYLE LOOKBOOK'];
const dyes={'원래 색':'','블랙':'#242224','다크 브라운':'#49362f','초코 브라운':'#704c3f','애쉬 브라운':'#85776c','애쉬 그레이':'#99999a','레드 브라운':'#9b5350','밀크 브라운':'#b18b69','블론드':'#d7bc82'};
let mod=0,student=1,active=false,starting=false,generation=0,lastQuality='',ready=false,measured=null,season=0,picked=null,color=palettes[0][0],saved=[],a=palettes[1][4],view='ab',hair=0,dye='원래 색',outfit=initial(),outfitA=null,showA=false,photo=null;
const notify=t=>$('notice').textContent=t;
function el(tag,text,parent=panel){const node=document.createElement(tag);if(text!=null)node.textContent=text;parent.append(node);return node}
function button(parent,label,action,cls=''){let b=el('button',label,parent);b.className=cls;b.onclick=action;return b}
function select(label,opts,val,onchange){const l=el('label',null);l.className='field';l.append(label);const s=el('select',null,l);for(const v of opts){let o=el('option',v,s);o.value=v}s.value=val;s.onchange=()=>onchange(s.value)}
const row=()=>{let r=el('div',null);r.className='row';return r};
function line(t){let d=el('div',t);d.className='data';return d}
function chip(parent,col){let s=el('span',null,parent);s.className='chip';s.style.background=col;return s}
function guideArt(){
 const w=screen.width=800,h=screen.height=560;
 let b=ctx.createLinearGradient(0,0,w,h);b.addColorStop(0,'#233a30');b.addColorStop(1,'#101f1b');ctx.fillStyle=b;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#cfebcf11';for(let x=0;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.save();ctx.translate(400,242);ctx.strokeStyle='#a7beac';ctx.lineWidth=1.4;
 const shape=(coords)=>{ctx.beginPath();coords.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()};
 const rings=[];for(let j=0;j<=10;j++){const t=j/10,yy=-142+274*t,rx=Math.sin(Math.PI*(.04+.92*t))**.62*(t>.58?91-(t-.58)*51:91);rings.push(Array.from({length:9},(_,i)=>[(i-4)*rx/4,yy+(1-((i-4)/4)**2)*Math.sin(t*Math.PI)*8]))}
 rings.forEach((r,j)=>{shape(r);if(j)r.forEach((p,i)=>{shape([rings[j-1][i],p]);if(i<8)shape([p,rings[j-1][i+1]])})});ctx.strokeStyle='#e4ac7f';shape([[-58,-11],[-37,-19],[-16,-11],[-37,-6],[-58,-11]]);shape([[58,-11],[37,-19],[16,-11],[37,-6],[58,-11]]);shape([[0,-10],[-9,32],[8,32]]);shape([[-25,66],[0,61],[25,66],[0,73],[-25,66]]);
 ctx.strokeStyle='#c3a58b';for(let x of [-1,1])for(let y of [-1,1])shape([[x*129,y*157-y*20],[x*129,y*157],[x*129-x*20,y*157]]);ctx.restore();
 ctx.textAlign='center';ctx.fillStyle='#eaf1e7';ctx.font='bold 22px sans-serif';ctx.fillText('웹캠 연결 대기',400,465);ctx.font='15px sans-serif';ctx.fillStyle='#b6c9ba';ctx.fillText('얼굴 위치 가이드  ·  카메라 시작을 눌러 주세요',400,496);ctx.textAlign='left'
}
let framing="portrait";
let latestDrape=null, frozenDrape=null;
function styleAdvice(shape,parent){
 const info=tips[shape];
 const box=el('section',null,parent);box.className='style-note';
 el('h3',shape+' · 헤어 길이 비교',box);el('p',info.feature,box);
 for(const [label,copy] of [['단발',info.short],['중단발',info.medium]]){
  el('b',label,box);el('p',copy,box);
 }
 const actions=el('div',null,box);actions.className='row';
 for(const style of info.styles)button(actions,style+' 체험',()=>{hair=hairNames.indexOf(style);mod=2;render();notify(style+'을 선택했습니다. 얼굴 옆에 머리 끝이 오는 위치를 관찰하세요.')});
 const link=el('a','자료 · 로레알 파리 헤어 가이드 ↗',box);link.href=info.source;link.target='_blank';link.rel='noopener noreferrer';
}
function drawComparison(){
 const frame=frozenDrape||latestDrape;
 const role=Math.max(0,colorInfo(color).i);
 paintDrapes(screen,frame?.img,frame?.face,view==='ab'?[a,color]:view==='four'?palettes.map(p=>p[role]):[color],framing);
}
function renderFace(){
 el('p','한 명이 정면을 보고 잠시 멈추면 측정 버튼이 활성화됩니다.');let b=button(panel,measured?'다시 측정':'현재 얼굴 측정',()=>{let m=capture();if(m){measured=m;render();notify('측정 완료 · 결과가 현재 학생의 룩북에 반영되었습니다.')}},'primary');b.id='capture';b.disabled=!ready;
 if(measured)styleAdvice(measured.g.shape,panel);
 else {const guide=el('details',null);el('summary','얼굴형별 헤어 가이드 미리보기',guide);
 const chooser=el('select',null,guide);chooser.setAttribute('aria-label','예시 얼굴형');Object.keys(tips).forEach(shape=>el('option',shape,chooser));
 const preview=el('div',null,guide);const show=()=>{preview.replaceChildren();styleAdvice(chooser.value,preview)};chooser.onchange=show;show()}
 el('h3','측정값 · 피부색');if(!measured)line('이마 · 양쪽 볼 측정 대기');else{
 const m=measured;line('평균 RGB '+m.rgb.join(' / ')+'   '+hex(m.rgb));line('CIELAB (D65)  '+m.lab.join(' / '));
 m.colors.forEach((v,i)=>{let d=line('');chip(d,hex(v));d.append(['이마','볼 ①','볼 ②'][i]+'   '+hex(v)+' · L* '+lab(v)[0])});
 el('p','L*는 밝기입니다. 두 볼의 밝기 차이는 '+Math.abs(lab(m.colors[1])[0]-lab(m.colors[2])[0]).toFixed(1)+'입니다. 평균 b* '+m.lab[2]+'는 '+(m.lab[2]>=0?'노랑':'파랑')+' 방향입니다. 조명과 자동 화이트밸런스에 따라 달라집니다.')}
 el('h3','알고리즘 추정 · 얼굴형');line(measured?measured.g.shape+'에 가까운 특징 · 세로/광대폭 '+measured.g.ratio.toFixed(2):'측정 후 해설이 표시됩니다.');
 if(measured)el('p','광대폭을 1로 볼 때 턱폭은 '+measured.g.jaw.toFixed(2)+', 이마폭은 '+measured.g.fore.toFixed(2)+'입니다. 여러 프레임에서 가장 자주 나온 유형을 표시합니다.');
 const d=el('details',null);el('summary','얼굴형 분류 기준',d);el('p','교육용 규칙을 순서대로 적용합니다. 세로/광대폭 > 1.56이면 긴형, (이마폭−턱폭)/광대폭 > 0.12이면 하트형, 턱폭/광대폭 > 0.84이면 각진형, 세로/광대폭 < 1.28이면 둥근형, 그 밖은 타원형입니다. 경계값과 명칭은 실습용 가설입니다.',d);
}
function draping(){
 select('비교 구도',['헤어·어깨 함께 보기','얼굴 가까이 보기'],framing==='portrait'?'헤어·어깨 함께 보기':'얼굴 가까이 보기',v=>{framing=v==='헤어·어깨 함께 보기'?'portrait':'face';render()});
 el('p',framing==='portrait'?'정수리와 어깨가 웹캠 안에 들어오도록 한 걸음 뒤로 앉으세요. 같은 헤어스타일에 천 색을 바꿔 얼굴과 머리색이 함께 주는 인상을 비교하세요.':'얼굴 윤곽 가까이에 색을 놓고 눈매와 입술 주변의 대비를 비교하세요.');
 el('h3','보기 방식');let options=row();options.classList.add('toggle');
 for(const [k,n] of [['ab','A/B 나란히'],['one','B 크게'],['four','4계절 한눈에']]){let b=button(options,n,()=>{view=k;render()});b.setAttribute('aria-pressed',view===k)}
 if(view==='four')el('p','B와 같은 계열('+(colorInfo(color).role||'선택색')+')의 색을 계절별로 나란히 놓았습니다. 같은 계열이라도 온도와 채도가 어떻게 다른지 비교하세요.');
 let hold=button(row(),frozenDrape?'실시간으로 돌아가기':'표정 고정',()=>{
  if(frozenDrape)frozenDrape=null;
  else if(latestDrape){const still=document.createElement('canvas');still.width=latestDrape.img.width;still.height=latestDrape.img.height;still.getContext('2d').drawImage(latestDrape.img,0,0);frozenDrape={img:still,face:latestDrape.face}}
  render()
 });hold.id='hold';hold.disabled=!frozenDrape&&!latestDrape;
 el('h3','두 색 바로 비교');let pairs=row();
 for(const [name,ref,si,idx] of [['피치 코랄 · 라벤더',palettes[0][0],1,4],['로즈 핑크 · 푸시아',palettes[1][0],3,0],['아이보리 · 퓨어 화이트',palettes[0][6],3,6],['카멜 · 쿨 토프',palettes[0][7],3,7]])button(pairs,name,()=>{a=ref;season=si;color=palettes[si][idx];view='ab';render()});
 el('h3','B 색상 바꾸기');
 let tabs=row();tabs.classList.add('toggle');seasons.forEach((n,i)=>{let b=button(tabs,n,()=>{const role=Math.max(0,colorInfo(color).i);season=i;color=palettes[i][role];render()});b.setAttribute('aria-pressed',season===i)});
 let sw=el('div',null);sw.className='swatches';for(const col of palettes[season]){const info=colorInfo(col);let b=button(sw,'',()=>{color=col;render()});let chipEl=el('span',null,b);chipEl.className='sw';chipEl.style.background=col;el('span',info.name,b).className='nm';b.title=info.name+' '+col;b.setAttribute('aria-label',info.name);b.setAttribute('aria-pressed',col===color)}
 const ia=colorInfo(a),ib=colorInfo(color);
 let ab=line('');chip(ab,a);ab.append('A  '+ia.name+(ia.season?' · '+ia.season:'')+'   ');chip(ab,color);ab.append('B  '+ib.name+(ib.season?' · '+ib.season:''));
 button(panel,'B를 A 기준색으로 고정',()=>{a=color;view='ab';render()});
 el('p','얼굴 추적 전에는 두 화면에 같은 기준색을 표시합니다. 실제 천에서 피부로 되비치는 빛은 화면에 재현되지 않습니다.');
 el('h3','내가 선택한 팔레트');button(panel,'현재 색 '+(saved.includes(color)?'빼기':'담기'),()=>{if(saved.includes(color))saved=saved.filter(v=>v!==color);else if(saved.length<5)saved.push(color);else return notify('다섯 색을 담았습니다. 기존 색을 빼면 새 색을 담을 수 있습니다.');render()});
 let d=line('');saved.forEach(col=>{let b=button(d,colorInfo(col).name,()=>{saved=saved.filter(v=>v!==col);render()});chip(b,col);b.title='눌러서 빼기'});if(!saved.length)d.append('비교한 색 중 3~5개를 담으세요.');
 button(panel,'이 계절을 룩북에 선택',()=>{picked=seasons[season];render()},'primary');line('나의 선택 · '+(picked??'미선택'));el('p',measured?'측정한 평균색은 '+hex(measured.rgb)+'입니다. 천을 번갈아 보며 얼굴 주변의 대비를 관찰하세요.':'측정 없이도 계절별 천을 비교할 수 있습니다.')
}
function hairs(){
 el('h3','헤어 디자인');let g=el('div',null);g.className='choices';hairNames.forEach((n,i)=>{let b=button(g,n,()=>{hair=i;render()});b.setAttribute('aria-pressed',hair===i)});
 el('h3','헤어 컬러');let sw=el('div',null);sw.className='dyes';
 for(const [n,col] of Object.entries(dyes)){let b=button(sw,'',()=>{dye=n;render();if(col&&active)prepareHair()});let dot=el('span',null,b);dot.className='dot';dot.style.background=col?'radial-gradient(circle at 34% 30%,#fff8 0,'+col+' 45%,#0006 115%)':'repeating-linear-gradient(45deg,#ddd 0 4px,#fff 4px 8px)';el('span',n,b);b.setAttribute('aria-pressed',dye===n)}
 el('p',active?'얼굴 윤곽을 따라 헤어 디자인이 움직입니다. 고개를 살짝 돌려 옆선도 확인해 보세요.':'카메라를 켜기 전에는 마네킹으로 미리 봅니다. 카메라를 켜면 내 얼굴 윤곽에 맞춰집니다.');
 el('p','헤어 디자인은 얼굴 랜드마크에 맞춰 그린 2D 시뮬레이션입니다. 염색은 머리카락으로 분리된 픽셀의 명암을 유지한 채 색만 바꿉니다. 원래 긴 머리는 짧은 디자인 밖에 남을 수 있습니다.')}
function hairPreview(){const w=screen.width=800,h=screen.height=560;studio(ctx,w,h);const F=mannequinFrame(400,150,150);drawMannequin(ctx,F);drawHair(ctx,F,hair,dyes[dye]||NATURAL);ctx.fillStyle='#6d685f';ctx.font='14px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillText(hair?'마네킹 미리보기 · '+hairNames[hair]+' · '+dye:'헤어 디자인을 선택하면 마네킹에 미리 보여 줍니다',400,h-16);ctx.textAlign='left'}
async function prepareHair(){const gen=generation;notify('헤어 분리 모델 로딩 중');try{await loadHair();if(gen===generation&&mod===2)notify('헤어 분리 모델 준비 완료')}catch{if(gen===generation&&mod===2){dye='원래 색';render();notify('헤어 모델 로딩 실패 · 네트워크 확인 후 색을 다시 선택하세요.')}}}
function wardrobe(){
 let edit=(k,v)=>{showA=false;outfit[k]=v;drawModel(ctx,outfit)};
 select('상의 디자인',tops,outfit.top,v=>edit('top',v));select('하의 디자인',bottoms,outfit.bottom,v=>edit('bottom',v));
 for(const [k,n] of [['upper','상의 색'],['lower','하의 색']]){let l=el('label',n);l.className='field';let i=el('input',null,l);i.type='color';i.value=outfit[k];i.oninput=()=>edit(k,i.value)}
 select('배색 적용',['선택하세요','톤온톤','톤인톤','모노톤','유사색','보색 대비','내 팔레트'],'선택하세요',v=>{let pairs={'톤온톤':['#b9cdbc','#44624e'],'톤인톤':['#bca6bd','#9eb8ad'],'모노톤':['#dededb','#393a3c'],'유사색':['#68828b','#596d91'],'보색 대비':['#cf8350','#4a718f'],'내 팔레트':saved};if(!pairs[v])return;if(pairs[v].length<2){notify('퍼스널 컬러에서 두 색 이상 담으세요.');return} [outfit.upper,outfit.lower]=pairs[v];showA=false;render()});
 const details=el('details',null);el('summary','마네킹 체형 설정',details);select('기본 마네킹',['여성형','남성형'],outfit.form,v=>edit('form',v));details.append(panel.lastChild);
 for(const [k,n,min,max] of [['height','키 (cm)',160,190],['weight','몸무게 (kg)',40,80],['shoulder','어깨너비',80,120],['waist','허리 비율',80,120],['hip','골반 비율',80,120],['torso','상체 길이',85,115],['arm','팔 길이',85,115],['leg','다리 길이',85,115]]){let l=el('label',null,details);l.className='field';let v=el('span',n+' '+outfit[k],l),i=el('input',null,l);i.type='range';i.min=min;i.max=max;i.value=outfit[k];i.oninput=()=>{v.textContent=n+' '+i.value;edit(k,+i.value)}}
 el('h3','시점과 비교');let r=row();for(const [n,ang] of [['정면',0],['측면',90],['후면',180]])button(r,n,()=>edit('angle',ang));button(r,'확대',()=>edit('zoom',Math.min(1.4,outfit.zoom+.1)));button(r,'축소',()=>edit('zoom',Math.max(.6,outfit.zoom-.1)));
 let r2=row();button(r2,'현재 코디 A 저장',()=>{outfitA={...outfit};showA=false;render()});let b=button(r2,showA?'현재 코디 B 보기':'저장 코디 A 보기',()=>{showA=!showA;render()});b.disabled=!outfitA;line(showA?'저장 코디 A 표시 중':'현재 코디 B · 룩북에 자동 반영');el('p','마네킹을 좌우로 드래그하면 회전합니다.')
}
function card(){
 screen.width=900;screen.height=600;ctx.fillStyle='#f5f1e8';ctx.fillRect(0,0,900,600);
 const m=document.createElement('canvas');m.width=360;m.height=480;drawModel(m.getContext('2d'),outfit);ctx.drawImage(m,506,75,360,480);
 ctx.fillStyle='#315446';ctx.fillRect(0,0,900,50);ctx.fillStyle='white';ctx.font='bold 16px Arial';ctx.fillText('ABLE FASHION LAB   /   STYLE LOOKBOOK',34,31);
 ctx.fillStyle='#302d28';ctx.font='bold 35px sans-serif';ctx.fillText('나의 스타일링 룩북',34,118);
 const rows=[['알고리즘 추정',measured?measured.g.shape+' · 세로/가로 '+measured.g.ratio.toFixed(2):'얼굴형 미측정'],['카메라 측정값',measured?hex(measured.rgb)+' · Lab '+measured.lab.join(' / '):'피부색 미측정'],['내가 선택한 계절',picked??'미선택'],['헤어 디자인',hairNames[hair]+' · '+dye],['코디 조합',outfit.top+' · '+outfit.bottom]];
 rows.forEach(([k,v],i)=>{let y=165+i*65;ctx.fillStyle='#776c5d';ctx.font='14px sans-serif';ctx.fillText(k,36,y);ctx.fillStyle='#272d26';ctx.font='bold 20px sans-serif';ctx.fillText(v,36,y+27)});
 saved.forEach((col,i)=>{ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(36+i*84,478,78,30,6);ctx.fill();ctx.strokeStyle='#0002';ctx.stroke();ctx.fillStyle='#4f483f';ctx.font='12px sans-serif';ctx.fillText(colorInfo(col).name,38+i*84,526,76)});ctx.fillStyle='#665f54';ctx.font='14px sans-serif';ctx.fillText('실습자 '+student+'   ·   '+outfit.upper.toUpperCase()+' / '+outfit.lower.toUpperCase(),36,565);
 if(photo)ctx.drawImage(photo,755,436,105,105)
}
function download(){screen.toBlob(b=>{if(!b)return;let url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='ABLE-lookbook-'+student+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)},'image/png')}
function lookbook(){el('p','측정값과 직접 선택한 스타일을 3:2 포토카드에 담습니다. 현재 코디 B가 인쇄됩니다.');button(panel,'룩북 PNG 저장',download,'primary');el('h3','얼굴 사진 선택');el('p','기본 룩북에는 얼굴 사진이 없습니다. 본인이 원할 때만 현재 웹캠 사진을 카드에 포함하세요.');let b=button(panel,photo?'사진 제외':'현재 웹캠 사진 포함',()=>{if(photo)photo=null;else if(active&&video.readyState>=2){photo=document.createElement('canvas');photo.width=photo.height=200;let sz=Math.min(video.videoWidth,video.videoHeight);photo.getContext('2d').drawImage(video,(video.videoWidth-sz)/2,(video.videoHeight-sz)/2,sz,sz,0,0,200,200)}render()});b.disabled=!photo&&!active}
function render(){if(mod!==1){latestDrape=null;frozenDrape=null}panel.replaceChildren();$('title').textContent=names[mod];$('kicker').textContent=en[mod];$('viewTitle').textContent=['얼굴 트래킹','가상 드레이핑','헤어 피팅','3D 마네킹','포토카드 미리보기'][mod];$('cameraTools').hidden=mod>=3;$('cameraTools').style.display=mod>=3&&!active&&!starting?'none':'';[...$('nav').children].forEach((n,i)=>n.setAttribute('aria-current',i===mod));if(mod===3){screen.width=800;screen.height=560;drawModel(ctx,showA?outfitA:outfit)}else if(mod===4)card();else if(mod===1)drawComparison();else if(!active)(mod===2?hairPreview():guideArt());[renderFace,draping,hairs,wardrobe,lookbook][mod]();$('signal').textContent=mod>=3?(active?'웹캠 켜짐':'로컬 작업'):active?lastQuality||'웹캠 연결됨':starting?'준비 중':'카메라 꺼짐'}
function frame(img,f,count,stable,now){
 active=true;starting=false;$('stop').disabled=false;ready=stable>=8;let b=$('capture');if(b)b.disabled=!ready;
 lastQuality=f?(f.issue|| (ready?'측정 준비 완료':'정면 유지 중')):count>1?'한 명씩 앉아 주세요':'얼굴 찾는 중';
 if(mod>=3)return;$('signal').textContent=lastQuality;
 if(mod===1){
 latestDrape=f?{img,face:f}:null;
 const hold=$('hold');if(hold)hold.disabled=!latestDrape&&!frozenDrape;
 drawComparison();if(frozenDrape)$('signal').textContent='표정 고정 중';return
 }
 let w=img.width,h=img.height;if(screen.width!==w||screen.height!==h){screen.width=w;screen.height=h}
 ctx.save();ctx.clearRect(0,0,w,h);ctx.translate(w,0);ctx.scale(-1,1);
 if(f){const z=Math.max(1,Math.min(1.8,w*.35/f.g.width)),cx=(f.p[234].x+f.p[454].x)/2,cy=(f.p[10].y+f.p[152].y)/2;ctx.translate(Math.max(w-w*z,Math.min(0,w/2-cx*z)),Math.max(h-h*z,Math.min(0,h*.43-cy*z)));ctx.scale(z,z)}
 ctx.drawImage(img,0,0);if(f){if(mod===0)drawTracking(ctx,f);if(mod===2){if(dyes[dye])colorHair(ctx,img,now,dyes[dye]);drawHair(ctx,faceFrame(f),hair,dyes[dye]||NATURAL)}}ctx.restore()
}
function stop(message){latestDrape=frozenDrape=null;generation++;stopVision(video);starting=active=ready=false;lastQuality='';$('start').disabled=false;$('stop').disabled=true;render();notify(message)}
async function devices(){try{let list=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput'),selected=video.srcObject?.getVideoTracks()[0]?.getSettings().deviceId||$('devices').value;$('devices').replaceChildren(new Option('기본 웹캠',''));list.forEach((d,i)=>{if(d.deviceId)$('devices').add(new Option(d.label||'웹캠 '+(i+1),d.deviceId))});$('devices').value=selected}catch{}}
async function start(){if(starting)return;const gen=++generation;active=false;starting=true;ready=false;$('start').disabled=true;$('stop').disabled=false;render();await startVision(video,$('devices').value,frame,notify,stop);if(gen!==generation)return;starting=false;active=!!video.srcObject;render();if(active){notify('웹캠 연결 완료 · 정면을 보고 실습을 시작하세요.');devices()}}
names.forEach((n,i)=>button($('nav'),n,()=>{mod=i;render();notify(['정면을 유지한 뒤 현재 얼굴 측정을 누르세요.','천 색상을 바꾸며 얼굴 주변의 대비를 비교하세요.','헤어 디자인과 색상을 선택하세요.','가상 체형에 맞춰 옷과 배색을 비교하세요.','저장한 PNG를 포토프린터에서 3:2 비율로 출력하세요.'][i])}));
$('start').onclick=start;$('stop').onclick=()=>stop('카메라를 종료했습니다.');$('devices').onchange=()=>{if(active){stop('웹캠 전환 중');start()}};
$('reset').onclick=()=>{if(!confirm('현재 학생의 측정값과 스타일을 지우고 다음 학생으로 교체할까요? 필요한 룩북을 먼저 저장하세요.'))return;measured=picked=a=outfitA=photo=null;saved=[];mod=season=hair=0;dye='원래 색';color=palettes[0][0];framing="portrait";a=palettes[1][4];view='ab';showA=false;outfit=initial();$('student').textContent=String(++student).padStart(2,'0');stop('새 학생 실습을 시작할 수 있습니다.')};
$('full').onclick=()=>{(document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()).catch(()=>notify('Chrome에서 F11을 눌러 전체 화면을 사용할 수 있습니다.'))};$('guide').onclick=()=>$('modal').showModal();
let drag=null;screen.onpointerdown=e=>{if(mod===3){drag=e.clientX;screen.setPointerCapture(e.pointerId)}};screen.onpointermove=e=>{if(drag!==null&&mod===3){let s=showA?outfitA:outfit;s.angle+=(e.clientX-drag)*.9;drag=e.clientX;drawModel(ctx,s)}};screen.onpointerup=screen.onpointercancel=()=>drag=null;
window.addEventListener('pagehide',()=>stopVision(video));render();devices();

$('preflight').onclick=async()=>{let b=$('preflight');b.disabled=true;$('check').textContent='얼굴 모델 준비 중…';try{await loadFace();$('check').textContent='얼굴 모델 준비 완료 · 헤어 모델 준비 중…';try{await loadHair();$('check').textContent='얼굴 및 헤어 모델 준비 완료'}catch(e){$('check').textContent='얼굴 모델 준비 완료 · 헤어 모델 실패 '+e.message}}catch(e){$('check').textContent='얼굴 모델 로딩 실패 '+e.message}finally{b.disabled=false}};
