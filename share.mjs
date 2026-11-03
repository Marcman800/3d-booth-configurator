import {defaults,panels,validate} from './geometry.mjs';
export const MAX_LINK_PAYLOAD=32000;
export function snapshotBase(project){
 if(project.objects.some(o=>o.type==='glb'))throw Error('Snapshot links do not yet include uploaded 3D models. Share the PDF and project JSON to preserve this design.');
 const d=defaults();
 for(const key of Object.keys(d))if(!['email','notes','panels','objects'].includes(key))d[key]=project[key];
 d.environment=project.environment||'hall';if(project.lighting)d.lighting=structuredClone(project.lighting);
 d.projectName=String(project.projectName||'Booth design').slice(0,80);
 d.email='';d.notes='Shared visual snapshot. Artwork is reduced-resolution preview material; not for production.';
 d.objects=project.objects.map(({id,type,x,z,rot,y})=>({id,type,x,z,rot,y:y||0}));d.panels={};if(project.wallLayouts)d.wallLayouts=structuredClone(project.wallLayouts);
 for(const p of panels(project)){const a=project.panels[p.id];if(a?.color)d.panels[p.id]={color:a.color};}
 return d;
}
async function streamBytes(stream,limit){const reader=stream.getReader();const chunks=[];let size=0;try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Shared design exceeds the supported size.');chunks.push(value);}}finally{await reader.cancel();}const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;}
export async function encodeSnapshot(project){validate(project);const data=await streamBytes(new Blob([JSON.stringify({format:'forma-view-1',project})]).stream().pipeThrough(new CompressionStream('gzip')),24000);let str='';for(const b of data)str+=String.fromCharCode(b);const result=btoa(str).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');if(result.length>MAX_LINK_PAYLOAD)throw Error('Design is too large for a reliable snapshot link. Share the PDF and project file instead.');return result;}
export async function decodeSnapshot(encoded){if(!encoded||encoded.length>MAX_LINK_PAYLOAD||!/^[A-Za-z0-9_-]+$/.test(encoded))throw Error('Invalid or truncated design link.');const bytes=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));const raw=await streamBytes(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),2000000);const payload=JSON.parse(new TextDecoder().decode(raw));if(payload.format!=='forma-view-1')throw Error('Unsupported design link version.');return validate(payload.project);}
