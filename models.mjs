import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
export const MAX_GLB=10*1024*1024;
export function inspectGLB(buffer){
 if(buffer.byteLength<20||buffer.byteLength>MAX_GLB)throw Error('Use a GLB between 20 bytes and 10 MB.');
 const v=new DataView(buffer);if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==buffer.byteLength)throw Error('This is not a valid GLB 2.0 file.');
 const len=v.getUint32(12,true);if(v.getUint32(16,true)!==0x4e4f534a||20+len>buffer.byteLength)throw Error('Invalid GLB metadata.');
 const j=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,len)));if(j.asset?.version!=='2.0')throw Error('GLB 2.0 is required.');
 for(const a of [...(j.buffers||[]),...(j.images||[])])if(a.uri&&!/^data:/.test(a.uri))throw Error('External files are not supported. Embed textures and buffers in the GLB.');
 const unsupported=['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'];if((j.extensionsUsed||[]).some(e=>unsupported.includes(e)))throw Error('Compressed geometry/KTX textures are not supported yet. Export an uncompressed GLB.');
 if((j.nodes||[]).length>3000)throw Error('Model has too many nodes (maximum 3,000).');
 const vertices=(j.meshes||[]).flatMap(m=>m.primitives||[]).reduce((n,p)=>n+(j.accessors?.[p.attributes?.POSITION]?.count||0),0);if(vertices>500000)throw Error('Model exceeds 500,000 vertices. Simplify it before uploading.');
 return j;
}
export function toData(buffer){let str='';for(const b of new Uint8Array(buffer))str+=String.fromCharCode(b);return btoa(str);}
export function fromData(data){return Uint8Array.from(atob(data),c=>c.charCodeAt(0)).buffer;}
export async function parseModel(buffer){inspectGLB(buffer);const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(!url.startsWith('blob:')&&!url.startsWith('data:'))throw Error('External model resources are blocked.');return url;});const gltf=await new GLTFLoader(manager).parseAsync(buffer,'');const root=gltf.scene;root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());if(![size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0.000001))throw Error('Model must contain visible geometry with non-zero width, height and depth.');root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return {root,size:[size.x,size.y,size.z],animations:gltf.animations.length};}
export function instanceModel(template,o){const root=clone(template);const oriented=new THREE.Group();oriented.add(root);oriented.rotation.set((o.pitch||0)*Math.PI/180,0,(o.roll||0)*Math.PI/180);oriented.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(oriented),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());const shifted=new THREE.Group();shifted.add(oriented);oriented.position.sub(new THREE.Vector3(centre.x,bounds.min.y,centre.z));const scaled=new THREE.Group();scaled.add(shifted);scaled.scale.set(o.size[0]/1000/size.x,o.size[1]/1000/size.y,o.size[2]/1000/size.z);scaled.userData.sharedModel=true;return scaled;}
