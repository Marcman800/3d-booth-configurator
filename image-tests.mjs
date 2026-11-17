import assert from 'node:assert/strict';
import {defaults,validate} from './geometry.mjs';
import {checkImageData} from './imageAssets.mjs';

// Builds a data URL holding only a PNG signature and IHDR header with the given dimensions.
function pngData(width,height){const b=Buffer.alloc(33);Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(b,0);b.writeUInt32BE(13,8);b.write('IHDR',12,'latin1');b.writeUInt32BE(width,16);b.writeUInt32BE(height,20);return 'data:image/png;base64,'+b.toString('base64');}
const withArt=(data,declared=[100,100])=>({...defaults(),panels:{'B-01':{asset:{name:'art.png',data,width:declared[0],height:declared[1]}}}});

assert.deepEqual(checkImageData(pngData(100,80)),{width:100,height:80,bytes:33});
assert.doesNotThrow(()=>validate(withArt(pngData(4096,2048))));
// Real header dimensions are checked even when the declared size claims to be small.
assert.throws(()=>validate(withArt(pngData(5000,100),[100,100])),/4,096 pixels/);
assert.throws(()=>validate(withArt(pngData(4000,4000))),/megapixels/);
assert.throws(()=>validate(withArt(pngData(100,100).replace('image/png','image/jpeg'))),/could not be read/);
assert.throws(()=>validate(withArt('data:image/png;base64,***')),/damaged/);
assert.throws(()=>validate(withArt('data:image/svg+xml;base64,AAAA')),/PNG or JPEG/);
assert.throws(()=>checkImageData(pngData(10,10),{maxBytes:10}),/MB or smaller/);
const logo={...defaults(),proposal:{company:'',colour:'#355d39',logo:{data:pngData(9000,10),width:100,height:10},event:'',eventDate:'',venue:'',preparedBy:'',revision:'',objectives:'',rationale:'',budget:'',currency:'',budgetNotes:'',appendix:false}};
assert.throws(()=>validate(logo));

// Object IDs and names.
const base=defaults();
assert.throws(()=>validate({...base,objects:[base.objects[0],{...base.objects[1],id:base.objects[0].id}]}),/unique ID/);
assert.throws(()=>validate({...base,objects:[{...base.objects[0],id:'<img onerror=x>'}]}),/unique ID/);
assert.throws(()=>validate({...base,objects:[{...base.objects[0],name:'x'.repeat(81)}]}),/80 characters/);
assert.throws(()=>validate({...base,objects:[{...base.objects[0],x:1e9}]}),/Invalid equipment/);
assert.doesNotThrow(()=>validate({...base,objects:[{...base.objects[0],name:'Reception desk'}]}));
console.log('Embedded image dimensions, formats, sizes, object IDs and names passed.');
