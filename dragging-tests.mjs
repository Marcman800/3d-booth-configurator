import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installDragging,snappedPosition} from './dragging.mjs';
globalThis.window=new EventTarget();
class Canvas extends EventTarget{style={};captured=null;getBoundingClientRect(){return {left:0,top:0,width:800,height:600};}setPointerCapture(id){this.captured=id;}hasPointerCapture(id){return this.captured===id;}releasePointerCapture(){this.captured=null;}}
const canvas=new Canvas(),scene=new THREE.Scene(),group=new THREE.Group(),root=new THREE.Group();root.userData.equipment='model';root.position.set(2,.75,2);root.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshBasicMaterial()));group.add(root);scene.add(group);
const camera=new THREE.PerspectiveCamera(45,800/600,.01,100);camera.position.set(6,6,8);camera.lookAt(2,0,2);camera.updateMatrixWorld();const controls={enabled:true};let selected,readonly=false,commits=[];
const drag=installDragging({canvas,camera,scene,controls,getRoots:()=>[group],getSelected:()=>selected,select:id=>selected=id,isReadOnly:()=>readonly,isWalking:()=>false,getSnap:()=>50,commit:(id,next)=>commits.push({id,...next}),onPanel:()=>{}});
const p=root.position.clone().project(camera),x=(p.x+1)*400,y=(1-p.y)*300;
const event=(target,type,props={})=>{const e=new Event(type);Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0,isPrimary:true,...props});target.dispatchEvent(e);};
event(canvas,'pointerdown');assert.equal(selected,'model');assert.equal(controls.enabled,false);event(canvas,'pointermove',{clientX:x+80});assert.equal(root.position.y,.75);assert.notEqual(root.position.x,2);assert.equal(commits.length,0);event(canvas,'pointerup',{clientX:x+80});assert.equal(commits.length,1);assert.equal(commits[0].x%50,0);assert.equal(commits[0].z%50,0);assert.equal(controls.enabled,true);
event(canvas,'pointerdown');event(canvas,'pointermove',{clientX:x+90});event(window,'keydown',{key:'Escape'});assert.equal(commits.length,1);assert.equal(root.position.x,2);assert.equal(controls.enabled,true);
event(canvas,'pointerdown');event(canvas,'pointercancel');assert.equal(commits.length,1);
readonly=true;selected=null;event(canvas,'pointerdown');event(canvas,'pointermove',{clientX:x+90});event(canvas,'pointerup');assert.equal(selected,null);assert.equal(commits.length,1);
assert.deepEqual(snappedPosition(126,274,50),{x:150,z:250});console.log('Object picking, height preservation, one-drop commit, snapping, cancellation and read-only protection passed.');
