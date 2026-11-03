import assert from 'node:assert/strict';
import {defaults,validate} from './geometry.mjs';
import {moveSet,alignObjects,placeOn} from './workflow.mjs';
const p=defaults();p.objects[0].group=p.objects[1].group='set';const before=structuredClone(p.objects);moveSet(p,p.objects[0].id,{x:3000,z:2000});assert.equal(p.objects[1].x-before[1].x,450);assert.equal(p.objects[1].z-before[1].z,100);
p.objects[1].locked=true;assert.throws(()=>moveSet(p,p.objects[0].id,{x:0,z:0}),/Unlock/);p.objects[1].locked=false;delete p.objects[0].group;delete p.objects[1].group;
alignObjects(p,[p.objects[0].id],'back');assert.equal(p.objects[0].z,535);alignObjects(p,[p.objects[0].id],'left');assert.equal(p.objects[0].rot,90);assert.equal(p.objects[0].x,535);assert.throws(()=>alignObjects(p,[p.objects[0].id],'right'),/Enable/);
placeOn(p,p.objects[1].id,p.objects[0].id);assert.equal(p.objects[1].y,770);assert.equal(p.objects[1].x,p.objects[0].x);
p.cameraViews=[{id:'front',name:'Front',position:[2,3,6],target:[2,1,1]}];assert.doesNotThrow(()=>validate(p));p.cameraViews[0].position[0]=Infinity;assert.throws(()=>validate(p),/saved view/);
console.log('Group movement, locks, wall alignment, support placement and saved-view validation passed.');
