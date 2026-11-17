// Local evaluation server only. Bind loopback: no account or payment authentication.
import http from 'node:http';
import {reviewStatus,reviewContent} from './workspace.mjs';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validate} from './geometry.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const dir=process.env.FORMA_DATA||root+'.local-data';await mkdir(dir,{recursive:true});
const DB=dir+'/reviews.json',BACKUPS=3,BACKUP_EVERY=10*60*1000;
// Loads the database. A missing main file falls back to the newest backup (a crash between backup rotation and rename); a damaged main file stops startup instead of being replaced.
async function load(){
 for(const file of [DB,DB+'.1']){
  let text;try{text=await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')continue;throw e;}
  let data;try{data=JSON.parse(text);}catch{throw Error(`${file} is damaged. Restore it from ${DB}.1, .2 or .3 before starting the server.`);}
  if(file!==DB)console.warn(`Loaded backup ${file} because ${DB} was missing.`);
  data.projects||=[];data.revisions||=[];storageBytes=Buffer.byteLength(text);return data;
 }
 storageBytes=0;return {plan:'free',revisions:[],projects:[]};
}
let storageBytes=0,lastBackup=0;let db=await load();
const digest=p=>createHash('sha256').update(JSON.stringify(reviewContent(p))).digest('hex');
const projectSummary=p=>{const latest=db.revisions.filter(r=>r.projectId===p.id).at(-1);return {id:p.id,title:p.project.projectName,updated:p.updated,version:p.version,archived:!!p.archived,status:latest&&latest.digest===digest(p.project)?reviewStatus(latest):'Draft',revision:latest?.revision};};
const ignoreMissing=e=>{if(e.code!=='ENOENT')throw e;};
async function rotateBackups(){for(let i=BACKUPS-1;i>=1;i--)await rename(`${DB}.${i}`,`${DB}.${i+1}`).catch(ignoreMissing);await rename(DB,DB+'.1').catch(ignoreMissing);}
// Writes the in-memory database. On failure the in-memory state is reloaded from disk, so the app never reports changes that were not saved.
async function persist(){
 const text=JSON.stringify(db);
 try{await writeFile(dir+'/reviews.tmp',text);if(Date.now()-lastBackup>BACKUP_EVERY){await rotateBackups();lastBackup=Date.now();}await rename(dir+'/reviews.tmp',DB);storageBytes=Buffer.byteLength(text);}
 catch(e){try{db=await load();}catch(reloadError){console.error(reloadError.message);}throw Error(`Could not save to disk (${e.code||e.message}). Your last saved version was kept.`);}
}
const token=()=>randomBytes(24).toString('hex');
const MAX_BODY=60*1024*1024;
const summary=r=>({id:r.id,title:r.title,revision:r.revision,created:r.created,digest:r.digest,revoked:r.revoked,token:r.token,events:r.events,projectId:r.projectId||null,status:reviewStatus(r)});
const SECURITY_HEADERS={'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin'};
const STATIC={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'};
const TYPES={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8'};
let queue=Promise.resolve();
// Static files and request bodies are handled outside the queue, so a slow upload does not hold up other requests. Only database work is serialised.
const server=http.createServer(async(req,res)=>{
 for(const [k,v] of Object.entries(SECURITY_HEADERS))res.setHeader(k,v);
 const send=(code,value)=>{if(res.headersSent)return res.destroy();res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 let path,body={};
 try{path=new URL(req.url,'http://localhost').pathname;
 if(!['localhost','127.0.0.1'].includes((req.headers.host||'').split(':')[0]))return send(403,{error:'Local access only'});
 if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return send(403,{error:'Origin rejected'});
 if(!path.startsWith('/api/')){if(req.method!=='GET')return send(405,{error:'Method not allowed'});const file=STATIC[path]||(/^\/chunks\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.js$/.test(path)?path.slice(1):null);if(!file)return send(404,{error:'Not found'});const data=await readFile(root+'dist/'+file);res.writeHead(200,{'Content-Type':TYPES[file.split('.').pop()],'Cache-Control':'no-cache'});return res.end(data);}
 if(req.method==='POST'){if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON required'});const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY){res.setHeader('Connection','close');return send(413,{error:'Project exceeds 60 MB'});}chunks.push(chunk);}body=JSON.parse(Buffer.concat(chunks,size).toString('utf8')||'{}');}
 }catch(e){return send(400,{error:e.message});}
 const run=()=>handle(req,path,body,send).catch(e=>send(400,{error:e.message}));
 queue=queue.then(run,run);
});
async function handle(req,path,body,send){
 if(path==='/api/workspace'&&req.method==='GET')return send(200,{plan:db.plan,storageBytes,revisions:db.revisions.map(summary),projects:db.projects.map(projectSummary)});
 if(path==='/api/projects'&&req.method==='POST'){
 const project=validate(body.project);let p=db.projects.find(p=>p.id===project.workspaceId);
 if(project.workspaceId&&!p)throw Error('Project no longer exists. Import it as a new project.');
 if(p&&project.workspaceVersion!==p.version)return send(409,{error:'This project changed in another window. Download your current JSON before reopening the saved project.'});
 if(!p){p={id:token(),version:0};db.projects.push(p);}p.version++;project.workspaceId=p.id;project.workspaceVersion=p.version;p.project=project;p.updated=new Date().toISOString();await persist();return send(200,{project,...projectSummary(p)});
 }
 const pm=path.match(/^\/api\/projects\/([a-f0-9]{48})(?:\/(duplicate|archive|rename))?$/);
 if(pm){const p=db.projects.find(p=>p.id===pm[1]);if(!p)return send(404,{error:'Project not found'});
 if(req.method==='GET'&&!pm[2])return send(200,{project:p.project,...projectSummary(p)});
 if(req.method==='POST'&&pm[2]==='duplicate'){const project=structuredClone(p.project);const id=token();project.workspaceId=id;project.workspaceVersion=1;project.projectName=(project.projectName+' — copy').slice(0,80);const copy={id,version:1,project,updated:new Date().toISOString()};db.projects.push(copy);await persist();return send(201,projectSummary(copy));}
 if(req.method==='POST'&&pm[2]==='archive'){p.archived=!!body.archived;await persist();return send(200,projectSummary(p));}
 if(req.method==='POST'&&pm[2]==='rename'){const name=String(body.name||'').trim();if(!name||name.length>80)throw Error('Enter a project name up to 80 characters.');p.project.projectName=name;p.version++;p.project.workspaceVersion=p.version;p.updated=new Date().toISOString();await persist();return send(200,projectSummary(p));}
 }
 if(path==='/api/plan'&&req.method==='POST'){if(!['free','studio'].includes(body.plan))throw Error('Invalid plan');db.plan=body.plan;await persist();return send(200,{plan:db.plan});}
 if(path==='/api/revisions'&&req.method==='POST'){
 const project=reviewContent(validate(body.project));const projectId=body.project.workspaceId||null;if(projectId&&!db.projects.some(p=>p.id===projectId))throw Error('Save this project before creating a revision.');
 const r={id:token(),token:token(),title:project.projectName,projectId,revision:db.revisions.filter(r=>(r.projectId||null)===projectId).length+1,created:new Date().toISOString(),project,events:[],revoked:false};
 r.digest=digest(project);db.revisions.push(r);await persist();return send(201,summary(r));
 }
 // Revoke by revision ID (owner workspace listing), not by the review token that reviewers hold in their link.
 const rv=path.match(/^\/api\/revisions\/([a-f0-9]{48})\/revoke$/);
 if(rv&&req.method==='POST'){const r=db.revisions.find(r=>r.id===rv[1]);if(!r)return send(404,{error:'Revision not found'});r.revoked=true;await persist();return send(200,{ok:true});}
 const match=path.match(/^\/api\/review\/([a-f0-9]{48})(?:\/(events))?$/);
 if(match){const r=db.revisions.find(r=>r.token===match[1]);if(!r)return send(404,{error:'Review not found'});
 if(r.revoked)return send(410,{error:'This review link has been disabled.'});
 if(req.method==='GET'&&!match[2]){const {id,...reviewer}=summary(r);return send(200,{...reviewer,project:r.project});}
 if(req.method==='POST'&&match[2]==='events'){
 const name=String(body.name||'').trim(),message=String(body.message||'').trim(),kind=body.kind;
 if(!name||name.length>100||!message||message.length>3000||!['comment','changes','approve'].includes(kind))throw Error('Enter your name and feedback (up to 3,000 characters).');
 if(kind==='approve'&&body.confirm!==true)throw Error('Confirm concept approval first.');
 r.events.push({id:token(),kind,name,message,created:new Date().toISOString(),revision:r.revision,digest:r.digest});await persist();return send(201,{events:r.events,projectId:r.projectId||null,status:reviewStatus(r)});
 }}
 return send(404,{error:'Not found'});
}
server.listen(Number(process.env.PORT||4174),'127.0.0.1',()=>console.log(`Forma local workspace: http://localhost:${server.address().port}`));
