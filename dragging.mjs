import * as THREE from 'three';
export function snappedPosition(x,z,step=0){return {x:step?Math.round(x/step)*step:Math.round(x),z:step?Math.round(z/step)*step:Math.round(z)};}
export function installDragging({canvas,camera,scene,controls,getRoots,getSelected,select,isReadOnly,isWalking,getSnap,commit,onPanel}){
 let drag=null,down=null;
 const ray=new THREE.Raycaster(),point=new THREE.Vector3();
 const outline=new THREE.BoxHelper(undefined,0xd18b28);outline.layers.set(1);outline.material.depthTest=false;outline.renderOrder=10;outline.visible=false;scene.add(outline);camera.layers.enable(1);
 const setRay=e=>{const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);};
 const rootFor=o=>{while(o&&!o.userData.equipment)o=o.parent;return o;};
 function finish(cancel=false){if(!drag)return;const d=drag;drag=null;d.root.position.copy(d.origin);controls.enabled=true;canvas.style.cursor='';if(canvas.hasPointerCapture(d.pointer))canvas.releasePointerCapture(d.pointer);if(!cancel&&d.moved)commit(d.id,d.next);}
 canvas.addEventListener('pointerdown',e=>{if(isReadOnly()||isWalking()||e.button!==0||!e.isPrimary)return;if(drag){finish(true);return;}down=[e.clientX,e.clientY];setRay(e);scene.updateMatrixWorld(true);const hit=ray.intersectObjects(getRoots(),true)[0];const root=hit&&rootFor(hit.object);if(!root)return;
 e.stopImmediatePropagation();controls.enabled=false;select(root.userData.equipment);const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-hit.point.y);if(!ray.ray.intersectPlane(plane,point)){controls.enabled=true;return;}
 drag={id:root.userData.equipment,root,origin:root.position.clone(),start:point.clone(),plane,pointer:e.pointerId,moved:false,next:null};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';
 },true);
 canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.stopImmediatePropagation();if(!drag.moved&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5)return;setRay(e);if(!ray.ray.intersectPlane(drag.plane,point))return;const next=snappedPosition((drag.origin.x+point.x-drag.start.x)*1000,(drag.origin.z+point.z-drag.start.z)*1000,getSnap());if(!Number.isFinite(next.x)||!Number.isFinite(next.z))return;drag.moved=true;drag.next=next;drag.root.position.x=next.x/1000;drag.root.position.z=next.z/1000;},true);
 canvas.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.pointer){e.stopImmediatePropagation();finish();down=null;return;}if(isReadOnly()||isWalking()||!down)return;if(Math.hypot(e.clientX-down[0],e.clientY-down[1])<5){setRay(e);const hit=ray.intersectObjects(getRoots(),true)[0];if(hit?.object.userData.panel)onPanel(hit.object.userData.panel);}down=null;},true);
 canvas.addEventListener('pointercancel',()=>finish(true),true);canvas.addEventListener('lostpointercapture',()=>finish(true));window.addEventListener('blur',()=>finish(true));window.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();finish(true);}});
 return {update(){const id=getSelected();const root=getRoots().flatMap(r=>r.children).find(r=>r.userData.equipment===id);outline.visible=!isReadOnly()&&!isWalking()&&!!root;if(outline.visible)outline.setFromObject(root);},cancel:()=>finish(true)};
}
