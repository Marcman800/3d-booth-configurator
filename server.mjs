// Local evaluation server only. Bind loopback: no account or payment authentication.
import http from 'node:http';
import {reviewStatus,reviewContent} from './workspace.mjs';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validate} from './geometry.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const dir=process.env.FORMA_DATA||root+'.local-data';await mkdir(dir,{recursive:true});
let db;try{db=JSON.parse(await readFile(dir+'/reviews.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;db={plan:'free',revisions:[]};}
db.projects||=[];
const digest=p=>createHash('sha256').update(JSON.stringify(reviewContent(p))).digest('hex');
const projectSummary=p=>{const latest=db.revisions.filter(r=>r.projectId===p.id).at(-1);return {id:p.id,title:p.project.projectName,updated:p.updated,version:p.version,archived:!!p.archived,status:latest&&latest.digest===digest(p.project)?reviewStatus(latest):'Draft',revision:latest?.revision};};
const persist=async()=>{await writeFile(dir+'/reviews.tmp',JSON.stringify(db));await rename(dir+'/reviews.tmp',dir+'/reviews.json');};
const token=()=>randomBytes(24).toString('hex');
const summary=r=>({id:r.id,title:r.title,revision:r.revision,created:r.created,digest:r.digest,revoked:r.revoked,token:r.token,events:r.events,projectId:r.projectId||null,status:reviewStatus(r)});
let queue=Promise.resolve();
const server=http.createServer((req,res)=>{queue=queue.then(async()=>{
 const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 try{const url=new URL(req.url,'http://localhost');const path=url.pathname;
 if(!['localhost','127.0.0.1'].includes((req.headers.host||'').split(':')[0]))return send(403,{error:'Local access only'});
 if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return send(403,{error:'Origin rejected'});
 let body={};if(req.method==='POST'){if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON required'});let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>60*1024*1024)return send(413,{error:'Project exceeds 60 MB'});}body=JSON.parse(data||'{}');}
 if(path==='/api/workspace'&&req.method==='GET')return send(200,{plan:db.plan,revisions:db.revisions.map(summary),projects:db.projects.map(projectSummary)});
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
 const match=path.match(/^\/api\/review\/([a-f0-9]{48})(?:\/(events|revoke))?$/);
 if(match){const r=db.revisions.find(r=>r.token===match[1]);if(!r)return send(404,{error:'Review not found'});
 if(match[2]==='revoke'&&req.method==='POST'){r.revoked=true;await persist();return send(200,{ok:true});}
 if(r.revoked)return send(410,{error:'This review link has been disabled.'});
 if(req.method==='GET'&&!match[2])return send(200,{...summary(r),project:r.project});
 if(req.method==='POST'&&match[2]==='events'){
 const name=String(body.name||'').trim(),message=String(body.message||'').trim(),kind=body.kind;
 if(!name||name.length>100||!message||message.length>3000||!['comment','changes','approve'].includes(kind))throw Error('Enter your name and feedback (up to 3,000 characters).');
 if(kind==='approve'&&body.confirm!==true)throw Error('Confirm concept approval first.');
 r.events.push({id:token(),kind,name,message,created:new Date().toISOString(),revision:r.revision,digest:r.digest});await persist();return send(201,{events:r.events,projectId:r.projectId||null,status:reviewStatus(r)});
 }}
 if(path.startsWith('/api/'))return send(404,{error:'Not found'});
 if(req.method!=='GET')return send(405,{error:'Method not allowed'});
 const allowed={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'};const file=allowed[path];if(!file)return send(404,{error:'Not found'});
 res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript','Cache-Control':'no-cache'});res.end(await readFile(root+'dist/'+file));
 }catch(e){send(400,{error:e.message});}
 }).catch(e=>{res.destroy();console.error(e.message);});});
server.listen(Number(process.env.PORT||4174),'127.0.0.1',()=>console.log(`Forma local workspace: http://localhost:${server.address().port}`));
