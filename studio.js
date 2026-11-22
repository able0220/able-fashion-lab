import {hex,lab,startVision,stopVision,capture,drawTracking,colorHair,loadHair,loadFace} from './vision.js';
import {initial,tops,bottoms,drawModel} from './wardrobe.js';
const $=id=>document.getElementById(id),screen=$('screen'),ctx=screen.getContext('2d'),video=$('video'),panel=$('controls');
const names=['얼굴 분석','퍼스널 컬러','헤어 디자인','패션 스타일링','디지털 룩북'],en=['FACE ANALYSIS','COLOR DRAPING','HAIR DESIGN','FASHION STUDIO','STYLE LOOKBOOK'];
const seasons=['봄 웜','여름 쿨','가을 웜','겨울 쿨'],palettes=[
['#FF977F','#FFBF95','#EACB65','#A9CA89','#80CEBB','#F7E5B7'],['#D9A5B6','#C5AED5','#AABDD9','#B1CEC7','#D0BCCC','#D7D8EB'],['#AB6346','#947646','#A18B52','#657457','#8B5147','#C5A67B'],['#B62959','#584798','#245DA0','#236F64','#2F3040','#E9EDF6']];
const hairNames=['원래 머리','단발','C컬 단발','중단발','긴 생머리','긴 웨이브','레이어드컷','시스루뱅','커튼뱅'],dyes={'원래 색':'','블랙':'#242224','다크 브라운':'#49362f','초코 브라운':'#704c3f','애쉬 브라운':'#85776c','애쉬 그레이':'#99999a','레드 브라운':'#9b5350','밀크 브라운':'#b18b69','블론드':'#d7bc82'};
let mod=0,student=1,active=false,starting=false,generation=0,lastQuality='',ready=false,measured=null,season=0,picked=null,color=palettes[0][0],saved=[],a=null,compare=false,hair=0,dye='원래 색',outfit=initial(),outfitA=null,showA=false,photo=null;
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
function renderFace(){
 el('p','한 명이 정면을 보고 잠시 멈추면 측정 버튼이 활성화됩니다.');let b=button(panel,measured?'다시 측정':'현재 얼굴 측정',()=>{let m=capture();if(m){measured=m;render();notify('측정 완료 · 결과가 현재 학생의 룩북에 반영되었습니다.')}},'primary');b.id='capture';b.disabled=!ready;
 el('h3','측정값 · 피부색');if(!measured)line('이마 · 양쪽 볼 측정 대기');else{
 const m=measured;line('평균 RGB '+m.rgb.join(' / ')+'   '+hex(m.rgb));line('CIELAB (D65)  '+m.lab.join(' / '));
 m.colors.forEach((v,i)=>{let d=line('');chip(d,hex(v));d.append(['이마','볼 ①','볼 ②'][i]+'   '+hex(v)+' · L* '+lab(v)[0])});
 el('p','L*는 밝기입니다. 두 볼의 밝기 차이는 '+Math.abs(lab(m.colors[1])[0]-lab(m.colors[2])[0]).toFixed(1)+'입니다. 평균 b* '+m.lab[2]+'는 '+(m.lab[2]>=0?'노랑':'파랑')+' 방향입니다. 조명과 자동 화이트밸런스에 따라 달라집니다.')}
 el('h3','알고리즘 추정 · 얼굴형');line(measured?measured.g.shape+'에 가까운 특징 · 세로/광대폭 '+measured.g.ratio.toFixed(2):'측정 후 해설이 표시됩니다.');
 if(measured)el('p','광대폭을 1로 볼 때 턱폭은 '+measured.g.jaw.toFixed(2)+', 이마폭은 '+measured.g.fore.toFixed(2)+'입니다. 여러 프레임에서 가장 자주 나온 유형을 표시합니다.');
 const d=el('details',null);el('summary','얼굴형 분류 기준',d);el('p','교육용 규칙을 순서대로 적용합니다. 세로/광대폭 > 1.56이면 긴형, (이마폭−턱폭)/광대폭 > 0.12이면 하트형, 턱폭/광대폭 > 0.84이면 각진형, 세로/광대폭 < 1.28이면 둥근형, 그 밖은 타원형입니다. 경계값과 명칭은 실습용 가설입니다.',d);
}
function draping(){
 select('비교할 계절',seasons,seasons[season],v=>{season=seasons.indexOf(v);color=palettes[season][0];render()});
 let sw=el('div',null);sw.className='swatches';for(const col of palettes[season]){let b=button(sw,'',()=>{color=col;render()});b.style.background=col;b.title=col;b.setAttribute('aria-label',col);b.setAttribute('aria-pressed',col===color)}
 line('현재 천   '+color);let r=row();button(r,'A에 고정',()=>{a=color;compare=true;render()});let cmp=button(r,compare?'한 색 보기':'A/B 비교',()=>{compare=!compare;render()});cmp.disabled=!a;if(a)line('A '+a+'   /   B '+color);
 el('h3','내가 선택한 팔레트');button(panel,'현재 색 '+(saved.includes(color)?'빼기':'담기'),()=>{if(saved.includes(color))saved=saved.filter(v=>v!==color);else if(saved.length<5)saved.push(color);else return notify('다섯 색을 담았습니다. 기존 색을 빼면 새 색을 담을 수 있습니다.');render()});
 let d=line('');saved.forEach(col=>{let b=button(d,col,()=>{saved=saved.filter(v=>v!==col);render()});chip(b,col);b.title='눌러서 빼기'});if(!saved.length)d.append('비교한 색 중 3~5개를 담으세요.');
 button(panel,'이 계절을 룩북에 선택',()=>{picked=seasons[season];render()},'primary');line('나의 선택 · '+(picked??'미선택'));el('p',measured?'측정한 평균색은 '+hex(measured.rgb)+'입니다. 천을 번갈아 보며 얼굴 주변의 대비를 관찰하세요.':'측정 없이도 계절별 천을 비교할 수 있습니다.')
}
function hairs(){select('헤어 디자인',hairNames,hairNames[hair],v=>{hair=hairNames.indexOf(v);render()});select('헤어 컬러',Object.keys(dyes),dye,v=>{dye=v;render();if(dyes[v])prepareHair()});el('p','디자인은 얼굴 기울기를 따라가는 2D 실루엣입니다. 염색은 머리카락으로 검출된 픽셀에 적용합니다. 긴 머리가 짧은 디자인 밖에 남을 수 있습니다.')}
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
function cloth(c,f,w,h){
 let cy=f.p[152].y+f.g.width*.06,cx=f.p[152].x,span=f.g.width*1.8;
 function half(left,col){c.save();c.beginPath();c.rect(left?0:cx,0,left?cx:w-cx,h);c.clip();let g=c.createLinearGradient(cx-span,0,cx+span,0);g.addColorStop(0,'#333');g.addColorStop(.3,col);g.addColorStop(.55,col);g.addColorStop(1,'#555');c.fillStyle=g;c.beginPath();c.moveTo(cx-span,h);c.quadraticCurveTo(cx-span*.7,cy,cx-f.g.width*.32,cy);c.quadraticCurveTo(cx,cy+f.g.width*.2,cx+f.g.width*.32,cy);c.quadraticCurveTo(cx+span*.7,cy,cx+span,h);c.fill();c.restore()}half(true,compare&&a?a:color);half(false,color)
}
function wig(c,f){
 if(!hair)return;let w=f.g.width,top=f.p[10];c.save();c.translate(top.x,top.y);c.rotate(f.g.roll);c.scale(w,w);let fill=dyes[dye]||'#49382f',len=[0,1.04,1.08,1.5,2.03,2.03,1.67,.48,.58][hair],wave=hair===5?.19:hair===2?.1:.035;
 let grad=c.createLinearGradient(-.65,0,.65,0);grad.addColorStop(0,'#302825');grad.addColorStop(.25,fill);grad.addColorStop(.5,'#594a40');grad.addColorStop(.8,fill);grad.addColorStop(1,'#312725');c.fillStyle=grad;
 for(let side of [-1,1]){c.save();c.scale(side,1);c.beginPath();c.moveTo(-.03,-.13);c.bezierCurveTo(.39,-.23,.66,.03,.6,.49);c.bezierCurveTo(.57+wave,.78,.55-wave,len-.23,.59+wave,len);c.quadraticCurveTo(.48,len+.12,.42,hair===6?len-.55:len-.13);c.bezierCurveTo(.49,len*.64,.49,.32,.29,.18);c.quadraticCurveTo(.1,.09,-.03,-.035);c.closePath();c.fill();c.restore()}
 if(hair===7){for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*.08,-.09);c.quadraticCurveTo(i*.1,.11,i*.09-.03,.31-Math.abs(i)*.025);c.quadraticCurveTo(i*.1+.05,.11,i*.08+.06,-.08);c.fill()}}c.restore()
}
function card(){
 screen.width=900;screen.height=600;ctx.fillStyle='#f5f1e8';ctx.fillRect(0,0,900,600);
 const m=document.createElement('canvas');m.width=360;m.height=480;drawModel(m.getContext('2d'),outfit);ctx.drawImage(m,506,75,360,480);
 ctx.fillStyle='#315446';ctx.fillRect(0,0,900,50);ctx.fillStyle='white';ctx.font='bold 16px Arial';ctx.fillText('ABLE FASHION LAB   /   STYLE LOOKBOOK',34,31);
 ctx.fillStyle='#302d28';ctx.font='bold 35px sans-serif';ctx.fillText('나의 스타일링 룩북',34,118);
 const rows=[['알고리즘 추정',measured?measured.g.shape+' · 세로/가로 '+measured.g.ratio.toFixed(2):'얼굴형 미측정'],['카메라 측정값',measured?hex(measured.rgb)+' · Lab '+measured.lab.join(' / '):'피부색 미측정'],['내가 선택한 계절',picked??'미선택'],['헤어 디자인',hairNames[hair]+' · '+dye],['코디 조합',outfit.top+' · '+outfit.bottom]];
 rows.forEach(([k,v],i)=>{let y=165+i*65;ctx.fillStyle='#776c5d';ctx.font='14px sans-serif';ctx.fillText(k,36,y);ctx.fillStyle='#272d26';ctx.font='bold 20px sans-serif';ctx.fillText(v,36,y+27)});
 saved.forEach((col,i)=>{ctx.fillStyle=col;ctx.fillRect(36+i*68,490,64,32)});ctx.fillStyle='#665f54';ctx.font='14px sans-serif';ctx.fillText('실습자 '+student+'   ·   '+outfit.upper.toUpperCase()+' / '+outfit.lower.toUpperCase(),36,565);
 if(photo)ctx.drawImage(photo,755,436,105,105)
}
function download(){screen.toBlob(b=>{if(!b)return;let url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='ABLE-lookbook-'+student+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)},'image/png')}
function lookbook(){el('p','측정값과 직접 선택한 스타일을 3:2 포토카드에 담습니다. 현재 코디 B가 인쇄됩니다.');button(panel,'룩북 PNG 저장',download,'primary');el('h3','얼굴 사진 선택');el('p','기본 룩북에는 얼굴 사진이 없습니다. 본인이 원할 때만 현재 웹캠 사진을 카드에 포함하세요.');let b=button(panel,photo?'사진 제외':'현재 웹캠 사진 포함',()=>{if(photo)photo=null;else if(active&&video.readyState>=2){photo=document.createElement('canvas');photo.width=photo.height=200;let sz=Math.min(video.videoWidth,video.videoHeight);photo.getContext('2d').drawImage(video,(video.videoWidth-sz)/2,(video.videoHeight-sz)/2,sz,sz,0,0,200,200)}render()});b.disabled=!photo&&!active}
function render(){panel.replaceChildren();$('title').textContent=names[mod];$('kicker').textContent=en[mod];$('viewTitle').textContent=['얼굴 트래킹','가상 드레이핑','헤어 피팅','3D 마네킹','포토카드 미리보기'][mod];$('cameraTools').hidden=mod>=3;$('cameraTools').style.display=mod>=3?'none':'';[...$('nav').children].forEach((n,i)=>n.setAttribute('aria-current',i===mod));if(mod===3){screen.width=800;screen.height=560;drawModel(ctx,showA?outfitA:outfit)}else if(mod===4)card();else if(!active)guideArt();[renderFace,draping,hairs,wardrobe,lookbook][mod]();$('signal').textContent=mod>=3?(active?'웹캠 켜짐':'로컬 작업'):active?lastQuality||'웹캠 연결됨':starting?'준비 중':'카메라 꺼짐'}
function frame(img,f,count,stable,now){
 active=true;starting=false;$('stop').disabled=false;ready=stable>=8;let b=$('capture');if(b)b.disabled=!ready;
 lastQuality=f?(f.issue|| (ready?'측정 준비 완료':'정면 유지 중')):count>1?'한 명씩 앉아 주세요':'얼굴 찾는 중';
 if(mod>=3)return;$('signal').textContent=lastQuality;
 let w=img.width,h=img.height;if(screen.width!==w||screen.height!==h){screen.width=w;screen.height=h}
 ctx.save();ctx.clearRect(0,0,w,h);ctx.translate(w,0);ctx.scale(-1,1);
 if(f){const z=Math.max(1,Math.min(1.8,w*.35/f.g.width)),cx=(f.p[234].x+f.p[454].x)/2,cy=(f.p[10].y+f.p[152].y)/2;ctx.translate(Math.max(w-w*z,Math.min(0,w/2-cx*z)),Math.max(h-h*z,Math.min(0,h*.43-cy*z)));ctx.scale(z,z)}
 ctx.drawImage(img,0,0);if(f){if(mod===0)drawTracking(ctx,f);if(mod===1)cloth(ctx,f,w,h);if(mod===2){if(dyes[dye])colorHair(ctx,img,now,dyes[dye]);wig(ctx,f)}}ctx.restore()
}
function stop(message){generation++;stopVision(video);starting=active=ready=false;lastQuality='';$('start').disabled=false;$('stop').disabled=true;render();notify(message)}
async function devices(){try{let list=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput'),selected=video.srcObject?.getVideoTracks()[0]?.getSettings().deviceId||$('devices').value;$('devices').replaceChildren(new Option('기본 웹캠',''));list.forEach((d,i)=>{if(d.deviceId)$('devices').add(new Option(d.label||'웹캠 '+(i+1),d.deviceId))});$('devices').value=selected}catch{}}
async function start(){if(starting)return;const gen=++generation;active=false;starting=true;ready=false;$('start').disabled=true;$('stop').disabled=false;render();await startVision(video,$('devices').value,frame,notify,stop);if(gen!==generation)return;starting=false;active=!!video.srcObject;render();if(active){notify('웹캠 연결 완료 · 정면을 보고 실습을 시작하세요.');devices()}}
names.forEach((n,i)=>button($('nav'),n,()=>{mod=i;render();notify(['정면을 유지한 뒤 현재 얼굴 측정을 누르세요.','천 색상을 바꾸며 얼굴 주변의 대비를 비교하세요.','헤어 디자인과 색상을 선택하세요.','가상 체형에 맞춰 옷과 배색을 비교하세요.','저장한 PNG를 포토프린터에서 3:2 비율로 출력하세요.'][i])}));
$('start').onclick=start;$('stop').onclick=()=>stop('카메라를 종료했습니다.');$('devices').onchange=()=>{if(active){stop('웹캠 전환 중');start()}};
$('reset').onclick=()=>{if(!confirm('현재 학생의 측정값과 스타일을 지우고 다음 학생으로 교체할까요? 필요한 룩북을 먼저 저장하세요.'))return;measured=picked=a=outfitA=photo=null;saved=[];mod=season=hair=0;dye='원래 색';color=palettes[0][0];compare=showA=false;outfit=initial();$('student').textContent=String(++student).padStart(2,'0');stop('새 학생 실습을 시작할 수 있습니다.')};
$('full').onclick=()=>{(document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()).catch(()=>notify('Chrome에서 F11을 눌러 전체 화면을 사용할 수 있습니다.'))};$('guide').onclick=()=>$('modal').showModal();
let drag=null;screen.onpointerdown=e=>{if(mod===3){drag=e.clientX;screen.setPointerCapture(e.pointerId)}};screen.onpointermove=e=>{if(drag!==null&&mod===3){let s=showA?outfitA:outfit;s.angle+=(e.clientX-drag)*.9;drag=e.clientX;drawModel(ctx,s)}};screen.onpointerup=screen.onpointercancel=()=>drag=null;
window.addEventListener('pagehide',()=>stopVision(video));render();devices();

$('preflight').onclick=async()=>{let b=$('preflight');b.disabled=true;$('check').textContent='얼굴 모델 준비 중…';try{await loadFace();$('check').textContent='얼굴 모델 준비 완료 · 헤어 모델 준비 중…';try{await loadHair();$('check').textContent='얼굴 및 헤어 모델 준비 완료'}catch(e){$('check').textContent='얼굴 모델 준비 완료 · 헤어 모델 실패 '+e.message}}catch(e){$('check').textContent='얼굴 모델 로딩 실패 '+e.message}finally{b.disabled=false}};
