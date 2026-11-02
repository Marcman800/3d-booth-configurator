import * as THREE from 'three';
export function recordingFormat(Recorder){return ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>Recorder?.isTypeSupported(type))||null;}
export function orbitPosition(centre,radius,elevation,progress){const angle=Math.PI/4+Math.PI*2*progress;return new THREE.Vector3(centre.x+radius*Math.sin(angle),centre.y+elevation,centre.z+radius*Math.cos(angle));}
export function installTour({scene,ready,bounds,filename,setBusy}){
 const button=document.createElement('button');button.textContent='Record 360° tour';document.querySelector('header').append(button);
 const dialog=document.createElement('dialog');dialog.innerHTML='<div class="modalHead"><h1>Record a booth tour</h1><button data-close aria-label="Close video recorder">✕</button></div><p>A full orbit, recorded in real time at 1280 × 720 and up to 24 fps. Keep this tab visible. Outer wall faces are blank; the camera will pass behind them. This is a normal orbit video, not an interactive spherical video.</p><label>Duration<select data-duration><option value="15">15 seconds</option><option value="20" selected>20 seconds</option></select></label><p data-status role="status"></p><div class="modalFoot"><button data-start class="primary">Start recording</button><button data-cancel hidden>Cancel recording</button><a data-download hidden>Download video</a></div><video data-preview controls playsinline hidden style="width:100%;max-height:360px;margin-top:16px"></video>';
 document.body.append(dialog);const q=s=>dialog.querySelector(s),status=q('[data-status]'),start=q('[data-start]'),cancel=q('[data-cancel]'),duration=q('[data-duration]'),link=q('[data-download]'),preview=q('[data-preview]');let active=false,abort=null,url=null;
 const clear=()=>{preview.pause();preview.removeAttribute('src');preview.hidden=true;link.hidden=true;if(url)URL.revokeObjectURL(url);url=null;};
 const format=recordingFormat(globalThis.MediaRecorder);
 button.onclick=()=>{status.textContent=format?'Records the scene only, without editor controls or selection outlines. No microphone is used.':'Video recording is unavailable in this browser. Try a current Chrome, Edge or Firefox browser.';start.disabled=!format;dialog.showModal();};
 const close=()=>{abort?.();preview.pause();dialog.close();};q('[data-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});cancel.onclick=()=>abort?.();
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)abort?.();});
 start.onclick=async()=>{
 if(active)return;active=true;let cancelled=false,renderer,stream,recorder,frame,timer;abort=()=>{cancelled=true;if(recorder?.state==='recording')recorder.stop();};clear();start.disabled=true;duration.disabled=true;cancel.hidden=false;setBusy(true);status.textContent='Preparing artwork and models…';
 try{
 await ready();if(cancelled)return;scene.updateMatrixWorld(true);const box=bounds(),centre=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());const radius=Math.max(1,size.length()/2);const distance=radius/Math.sin(19*Math.PI/180)*1.12;const elevation=distance*.35;const horizontal=Math.sqrt(distance*distance-elevation*elevation);
 const camera=new THREE.PerspectiveCamera(38,16/9,.05,250);camera.layers.enable(2);
 renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(1280,720);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 if(!renderer.domElement.captureStream)throw Error('Canvas recording is unavailable in this browser.');
 camera.position.copy(orbitPosition(centre,horizontal,elevation,0));camera.lookAt(centre);renderer.render(scene,camera);
 stream=renderer.domElement.captureStream(24);recorder=new MediaRecorder(stream,{mimeType:format,videoBitsPerSecond:6000000});const chunks=[];
 const done=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=resolve;recorder.onerror=e=>reject(e.error||Error('Recording failed.'));});
 const seconds=Number(duration.value),begin=performance.now();recorder.start(500);
 const draw=now=>{if(recorder.state!=='recording')return;try{const progress=Math.min(1,(now-begin)/(seconds*1000));camera.position.copy(orbitPosition(centre,horizontal,elevation,progress));camera.lookAt(centre);renderer.render(scene,camera);status.textContent=`Recording… ${Math.round(progress*100)}%`;if(progress===1)recorder.stop();else frame=requestAnimationFrame(draw);}catch(e){status.textContent=e.message;abort();}};
 frame=requestAnimationFrame(draw);timer=setTimeout(()=>{if(recorder.state==='recording'){cancelled=true;recorder.stop();}},(seconds+10)*1000);await done;
 if(!cancelled){const blob=new Blob(chunks,{type:recorder.mimeType||format});if(!blob.size)throw Error('The browser produced an empty recording.');url=URL.createObjectURL(blob);const extension=blob.type.includes('mp4')?'mp4':'webm';link.href=url;link.download=filename()+'-360-tour.'+extension;link.textContent='Download '+extension.toUpperCase()+' video';link.hidden=false;preview.src=url;preview.hidden=false;status.textContent=`Tour ready · ${(blob.size/1048576).toFixed(1)} MB. Preview it, then download.`;}
 }catch(e){status.textContent='Could not record: '+e.message;}finally{cancelAnimationFrame(frame);clearTimeout(timer);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());renderer?.dispose();renderer?.forceContextLoss();if(cancelled)status.textContent='Recording cancelled. Keep the tab visible and try again.';active=false;abort=null;setBusy(false);start.disabled=!format;duration.disabled=false;cancel.hidden=true;}
 };
}
