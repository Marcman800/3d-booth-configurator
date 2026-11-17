import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,chmod,access,rename as move,writeFile as put} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {defaults} from './geometry.mjs';
import net from 'node:net';
const dir=await mkdtemp(tmpdir()+'/forma-test-'),port=43189;
let child;
async function start(){child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),FORMA_DATA:dir}});await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));});}
async function stop(){await new Promise(resolve=>{child.once('exit',resolve);child.kill();});}
// Sends the body in two TCP writes split inside a multi-byte character.
async function splitPost(path,value){const body=Buffer.from(JSON.stringify(value)),at=body.indexOf(Buffer.from('é'))+1;return new Promise((resolve,reject)=>{const socket=net.connect(port,'127.0.0.1',()=>{socket.write(`POST /api/${path} HTTP/1.1\r\nHost: localhost:${port}\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\nConnection: close\r\n\r\n`);socket.write(body.subarray(0,at));setTimeout(()=>socket.write(body.subarray(at)),100);});let out='';socket.on('data',d=>out+=d);socket.on('error',reject);socket.on('end',()=>{const raw=out.slice(out.indexOf('\r\n\r\n')+4);resolve(JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1)));});});}
async function call(path,body){const r=await fetch(`http://localhost:${port}/api/${path}`,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});return {status:r.status,data:await r.json()};}
try{await start();const p=defaults();p.email='private@example.com';p.notes='private';const r=(await call('revisions',{project:p})).data;assert.equal(r.revision,1);p.width=6000;let view=(await call('review/'+r.token)).data;assert.notEqual(view.project.width,p.width);assert.equal(view.project.email,'');assert.equal(view.project.notes,'');
assert.equal((await call(`review/${r.token}/events`,{kind:'approve',name:'Board member',message:'Approved'})).status,400);
await call(`review/${r.token}/events`,{kind:'comment',name:'Board member',message:'Looks good'});
await call(`review/${r.token}/events`,{kind:'approve',name:'Board member',message:'Concept only',confirm:true});
const saved=(await call('projects',{project:defaults()})).data;const projectId=saved.id;
assert.equal(saved.status,'Draft');const pr=(await call('revisions',{project:saved.project})).data;assert.equal(pr.revision,1);
assert.equal((await call('projects/'+projectId)).data.status,'Awaiting review');
await call(`review/${pr.token}/events`,{kind:'changes',name:'Test reviewer',message:'Adjust layout'});
assert.equal((await call('projects/'+projectId)).data.status,'Changes requested');
await call(`review/${pr.token}/events`,{kind:'approve',name:'Test reviewer',message:'Concept approved',confirm:true});
assert.equal((await call('projects/'+projectId)).data.status,'Approved');
const changed=structuredClone(saved.project);changed.depth=4000;
assert.equal((await call('projects',{project:changed})).data.status,'Draft');
assert.equal((await call('projects',{project:saved.project})).status,409);
const copy=(await call('projects/'+projectId+'/duplicate',{})).data;assert.notEqual(copy.id,projectId);assert.equal(copy.status,'Draft');
await call('projects/'+copy.id+'/archive',{archived:true});assert.equal((await call('projects/'+copy.id)).data.archived,true);
await call('projects/'+copy.id+'/archive',{archived:false});assert.equal((await call('projects/'+copy.id)).data.archived,false);
await call('projects/'+copy.id+'/rename',{name:'Renamed concept'});assert.equal((await call('projects/'+copy.id)).data.title,'Renamed concept');
assert.equal((await call('review/'+pr.token)).data.project.depth,saved.project.depth);
await call('plan',{plan:'studio'});await stop();await start();view=(await call('review/'+r.token)).data;assert.equal(view.events.length,2);assert.equal(view.events[1].digest,r.digest);assert.equal((await call('workspace')).data.plan,'studio');
assert.equal(view.id,undefined);assert.equal((await call(`review/${r.token}/revoke`,{})).status,404);assert.equal((await call('review/'+r.token)).status,200);
await call(`revisions/${r.id}/revoke`,{});assert.equal((await call('review/'+r.token)).status,410);assert.equal((await call(`review/${r.token}/events`,{kind:'comment',name:'X',message:'X'})).status,410);
const unicode={...defaults(),projectName:'Café Stand — Zürich'};assert.equal((await splitPost('projects',{project:unicode})).project.projectName,'Café Stand — Zürich');
const cross=await fetch(`http://localhost:${port}/api/plan`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{"plan":"free"}'});assert.equal(cross.status,403);assert.equal((await call('projects/'+projectId)).data.status,'Draft');
// Security headers and storage size.
const page=await fetch(`http://localhost:${port}/`);assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(page.headers.get('x-content-type-options'),'nosniff');
for(const bad of ['/chunks/..%2Fserver.mjs','/chunks/../server.mjs','/chunks/.js','/server.mjs','/chunks/x..js'])assert.equal((await fetch(`http://localhost:${port}${bad}`)).status,404,bad);
const workspace=(await call('workspace')).data;assert(workspace.storageBytes>1000);
// A failed disk write is rolled back in memory and reported.
const before=workspace.projects.length;await chmod(dir,0o555);try{const failed=await call('projects',{project:defaults()});assert.equal(failed.status,400);assert.match(failed.data.error,/Could not save/);assert.equal((await call('workspace')).data.projects.length,before);}finally{await chmod(dir,0o755);}
assert.equal((await call('projects',{project:defaults()})).status,200);
// The first save after startup rotates a backup; a missing main file falls back to it, a damaged one stops startup.
await access(dir+'/reviews.json.1');await stop();await move(dir+'/reviews.json',dir+'/moved.json');await start();const restored=(await call('workspace')).data.projects.length;assert(restored>0&&restored<=before);await stop();
await put(dir+'/reviews.json','{broken');let exited=false;try{await start();}catch{exited=true;}assert(exited);await move(dir+'/moved.json',dir+'/reviews.json');await start();
console.log('Project CRUD, conflict detection, approval-to-draft status and local review persistence, immutable revisions, approval consent, owner-only revocation, split UTF-8 bodies, origin, security headers, failed-write rollback and backup tests passed.');
}finally{if(child?.exitCode===null)await stop();await rm(dir,{recursive:true,force:true});}
