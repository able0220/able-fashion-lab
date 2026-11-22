const base='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const storage='https://storage.googleapis.com/mediapipe-models/';
const outline=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const median=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
export const hex=a=>'#'+a.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('').toUpperCase();
export function lab(rgb){
 const [r,g,b]=rgb.map(n=>{let x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});
 const f=n=>n>216/24389?Math.cbrt(n):(903.2963*n+16)/116;
 const x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);
 return [116*y-16,500*(x-y),200*(y-z)].map(v=>+v.toFixed(1))
}
export function geometry(p){
 const d=(a,b)=>Math.hypot(p[a].x-p[b].x,p[a].y-p[b].y);
 const width=d(234,454),ratio=d(10,152)/width,jaw=d(172,397)/width,fore=d(103,332)/width;
 const shape=ratio>1.56?'긴형':fore-jaw>.12?'하트형':jaw>.84?'각진형':ratio<1.28?'둥근형':'타원형';
 return {ratio,jaw,fore,shape,width,roll:Math.atan2(p[263].y-p[33].y,p[263].x-p[33].x),yaw:Math.abs(d(1,234)-d(1,454))/width,pitch:d(1,152)/d(10,152)}
}
const raw=document.createElement('canvas'),src=raw.getContext('2d',{willReadFrequently:true});
const tint=document.createElement('canvas'),tc=tint.getContext('2d');
let runtime,face,hair,faceLoad,hairLoad,request=0,stream,raf,lastTime=-1,lastTick=0,history=[],latest=null;
const runtimeLoad=()=>runtime??=(async()=>{const api=await import(base+'/vision_bundle.mjs');return {api,files:await api.FilesetResolver.forVisionTasks(base+'/wasm')}})().catch(e=>{runtime=null;throw e});
export async function loadFace(){
 if(!faceLoad)faceLoad=(async()=>{const {api,files}=await runtimeLoad();face=await api.FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:storage+'face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:2});return face})().catch(e=>{faceLoad=null;throw e});
 return faceLoad
}
export async function loadHair(){
 if(!hairLoad)hairLoad=(async()=>{const {api,files}=await runtimeLoad();hair=await api.ImageSegmenter.createFromOptions(files,{baseOptions:{delegate:'GPU',modelAssetPath:storage+'image_segmenter/hair_segmenter/float32/1/hair_segmenter.tflite'},runningMode:'VIDEO',outputCategoryMask:true,outputConfidenceMasks:false})})().catch(e=>{hairLoad=null;throw e});
 return hairLoad
}
export function stopVision(video){request++;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;latest=null;history=[];lastTime=-1;raw.width=1;tint.width=1}
function sample(x,y,r){
 const px=src.getImageData(Math.round(x-r),Math.round(y-r),2*r+1,2*r+1).data, channels=[[],[],[]];
 for(let i=0;i<px.length;i+=4){if(Math.min(px[i],px[i+1],px[i+2])<3||Math.max(px[i],px[i+1],px[i+2])>252)continue;channels.forEach((c,k)=>c.push(px[i+k]))}
 return channels[0].length>r*r?channels.map(median):null
}
function inspect(p,w,h){
 const g=geometry(p),blend=(a,b,t)=>({x:p[a].x*(1-t)+p[b].x*t,y:p[a].y*(1-t)+p[b].y*t});
 const points=[blend(10,9,.62),blend(50,101,.5),blend(280,330,.5)],r=Math.max(2,Math.round(g.width*.032));
 const colors=points.map(q=>sample(q.x,q.y,r));let issue='';
 if(outline.some(i=>p[i].x<4||p[i].x>w-4||p[i].y<4||p[i].y>h-4))issue='얼굴 전체가 화면에 들어오게 해 주세요.';
 else if(g.width<w*.2)issue='웹캠에 조금 더 가까이 앉으세요.';
 else if(g.yaw>.13||Math.abs(g.roll)>.18||g.pitch<.29||g.pitch>.58)issue='턱과 눈을 수평으로 맞추고 정면을 보세요.';
 else if(colors.some(c=>!c))issue='반사광이나 짙은 그림자를 피해 조명을 조절하세요.';
 else if(Math.abs(lab(colors[1])[0]-lab(colors[2])[0])>15)issue='양쪽 볼의 밝기 차이가 큽니다. LED 방향을 맞춰 주세요.';
 return {p,g,points,colors,issue}
}
export async function startVision(video,id,frame,report,ended){
 stopVision(video);const token=request;
 try{
 report('AI 모델 로딩 중');await loadFace();if(token!==request)return;
 report('웹캠 권한 확인 중');const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{...(id?{deviceId:{exact:id}}:{}),width:{ideal:640},height:{ideal:480}}});
 if(token!==request){acquired.getTracks().forEach(t=>t.stop());return}
 stream=acquired;stream.getVideoTracks()[0].onended=()=>{if(token===request)ended('웹캠 연결이 끊겼습니다. 다시 연결해 주세요.')};video.srcObject=stream;await video.play();if(token!==request)return;
 const tick=now=>{if(token!==request)return;try{if(video.readyState>=2&&video.currentTime!==lastTime&&now-lastTick>85){
 lastTime=video.currentTime;lastTick=now;let w=video.videoWidth,h=video.videoHeight;if(raw.width!==w||raw.height!==h){raw.width=w;raw.height=h}src.drawImage(video,0,0,w,h);
 const faces=face.detectForVideo(raw,now).faceLandmarks;
 latest=faces.length===1?inspect(faces[0].map(q=>({x:q.x*w,y:q.y*h})),w,h):null;
 if(latest&&!latest.issue){let prev=history.at(-1);if(prev&&Math.hypot(latest.p[1].x-prev.p[1].x,latest.p[1].y-prev.p[1].y)>latest.g.width*.09)history=[];history.push(latest);if(history.length>10)history.shift()}else history=[];
 frame(raw,latest,faces.length,history.length,now)
 }raf=requestAnimationFrame(tick)}catch(e){ended('영상 분석이 중단되었습니다. 웹캠을 다시 시작해 주세요. '+e.message)}};
 raf=requestAnimationFrame(tick)
 }catch(e){if(token===request)ended(e.name==='NotAllowedError'?'Chrome 주소창의 카메라 권한을 허용한 후 다시 시작하세요.':e.name==='NotFoundError'?'연결된 웹캠이 없습니다. USB 연결을 확인하세요.':'모델 또는 웹캠을 시작하지 못했습니다. 네트워크와 장치 사용 상태를 확인하세요. '+e.message)}
}
export function capture(){
 if(history.length<8)return null;
 const colors=[0,1,2].map(i=>[0,1,2].map(k=>median(history.map(f=>f.colors[i][k]))));
 const g={...latest.g};for(const k of ['ratio','jaw','fore'])g[k]=median(history.map(f=>f.g[k]));
 const votes=history.map(f=>f.g.shape);g.shape=votes.slice().sort((a,b)=>votes.filter(v=>v===b).length-votes.filter(v=>v===a).length)[0];
 const rgb=[0,1,2].map(i=>Math.round(colors.reduce((sum,c)=>sum+c[i],0)/3));return {g,colors,rgb,lab:lab(rgb)}
}
export function drawTracking(c,f){c.lineWidth=1.6;c.strokeStyle='#b1f4c9';c.beginPath();outline.forEach((i,j)=>{let q=f.p[i];j?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)});c.closePath();c.stroke();for(const q of f.p.filter((_,i)=>i%5===0)){c.fillStyle='#dbffe5aa';c.fillRect(q.x-1,q.y-1,2,2)}for(const q of f.points){c.strokeStyle='white';c.strokeRect(q.x-5,q.y-5,10,10)}}
export function colorHair(c,img,now,color){if(!hair)return;hair.segmentForVideo(img,now,result=>{const m=result.categoryMask,data=m.getAsUint8Array();tint.width=m.width;tint.height=m.height;const pixels=tc.createImageData(m.width,m.height),rgb=color.match(/\w\w/g).map(s=>parseInt(s,16));for(let i=0;i<data.length;i++){if(data[i]===1){const j=i*4;pixels.data[j]=rgb[0];pixels.data[j+1]=rgb[1];pixels.data[j+2]=rgb[2];pixels.data[j+3]=180}}tc.putImageData(pixels,0,0);c.save();c.globalCompositeOperation='soft-light';c.drawImage(tint,0,0,img.width,img.height);c.globalCompositeOperation='source-over';c.globalAlpha=.42;c.drawImage(tint,0,0,img.width,img.height);c.restore()})}

