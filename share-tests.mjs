import assert from 'node:assert/strict';
import {defaults} from './geometry.mjs';
import {snapshotBase,encodeSnapshot,decodeSnapshot} from './share.mjs';
const source=defaults();source.email='private@example.com';source.notes='Confidential quote';source.projectName='Müller & 展示';source.panels['B-01']={color:'#123456',asset:{name:'secret-source.png',data:'do-not-leak'}};
const snapshot=snapshotBase(source);assert.equal(snapshot.email,'');assert(!snapshot.notes.includes('Confidential'));assert.equal(snapshot.panels['B-01'].asset,undefined);assert.equal(snapshot.panels['B-01'].color,'#123456');snapshot.objects[0].x=500;assert.notEqual(source.objects[0].x,500);
const encoded=await encodeSnapshot(snapshot);const recovered=await decodeSnapshot(encoded);assert.deepEqual(recovered,snapshot);assert(encoded.length<2000);
await assert.rejects(decodeSnapshot('broken!'));await assert.rejects(decodeSnapshot('a'.repeat(32001)));await assert.rejects(encodeSnapshot({...snapshot,width:-1}));
const invalid=defaults();invalid.objects=[{id:'evil',type:'constructor',x:0,z:0,rot:0}];await assert.rejects(encodeSnapshot(invalid));
console.log('Snapshot round trip, privacy filtering, immutability, Unicode and invalid input checks passed.');
