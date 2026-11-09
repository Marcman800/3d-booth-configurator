import * as THREE from 'three';

const finishes={matte:{roughness:.92,metalness:0},satin:{roughness:.5,metalness:0},gloss:{roughness:.16,metalness:0},metallic:{roughness:.3,metalness:.82}};

export function applyObjectAppearance(root,object,textureAssets={},trackTexture=()=>{},onTextureError=()=>{}){
 const bySource=new Map(),slots=[],ownedMaterials=[],ownedTextures=[],texturesById=new Map();
 root.traverse(node=>{
  if(!node.isMesh)return;
  const uv=!!node.geometry?.getAttribute('uv');
  const sources=Array.isArray(node.material)?node.material:[node.material];
  const clones=sources.map(source=>{
   let entry=bySource.get(source);
   if(!entry){const id=`m${slots.length}`,material=source.clone();material.userData.formaAppearanceMaterial=true;material.userData.formaMaterialId=id;entry={id,material,originalMap:source.map,uv,name:source.name||''};bySource.set(source,entry);slots.push(entry);ownedMaterials.push(material);}
   else entry.uv=entry.uv&&uv;
   return entry.material;
  });
  node.material=Array.isArray(node.material)?clones:clones[0];
 });
 const base=object.appearance||{},perMaterial=base.materials||{};
 for(const slot of slots){
  const material=slot.material,override=perMaterial[slot.id]||{};
  const color=override.color||base.color;if(color&&material.color)material.color.set(color);
  const finish=override.finish||base.finish;if(finish&&finishes[finish])Object.assign(material,finishes[finish]);
  const textureId=override.textureId,asset=textureId&&textureAssets[textureId];
  if(asset&&slot.uv){
   let texture=texturesById.get(textureId);
   if(!texture){let resolve;const loaded=new Promise(r=>resolve=r);trackTexture(loaded);texture=new THREE.TextureLoader().load(asset.data,t=>{t.colorSpace=THREE.SRGBColorSpace;t.flipY=object.type!=='glb';t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true;resolve();},undefined,error=>{for(const same of slots)if(perMaterial[same.id]?.textureId===textureId){same.material.map=same.originalMap;same.material.needsUpdate=true;}onTextureError(error);resolve();});texturesById.set(textureId,texture);ownedTextures.push(texture);}
   material.map=texture;material.needsUpdate=true;
  }
 }
 root.userData.appearanceManaged=true;root.userData.appearanceMaterials=slots.map(({id,name,uv})=>({id,name,uv}));root.userData.appearanceOwnedMaterials=ownedMaterials;root.userData.appearanceOwnedTextures=ownedTextures;
 return root.userData.appearanceMaterials;
}

export function installAppearanceEditor(container,{onChange,onUpload,onClear,onReset}){
 const section=document.createElement('section');section.className='appearanceControls';section.innerHTML='<h2>Appearance</h2><label>Surface<select data-material></select></label><label>Colour / tint<input data-color type="color" value="#ffffff"></label><label>Finish<select data-finish><option value="original">Original</option><option value="matte">Matte</option><option value="satin">Satin</option><option value="gloss">Gloss</option><option value="metallic">Metallic</option></select></label><label class="upload">↥ Upload image texture<input data-file type="file" accept="image/png,image/jpeg"></label><p data-status class="hint">White keeps the model’s original colour. Image textures require UV mapping.</p><div class="add"><button data-clear>Remove texture</button><button data-reset>Reset appearance</button></div>';
 const insertBefore=container.querySelector('#duplicateObject')||null;container.insertBefore(section,insertBefore);
 const material=section.querySelector('[data-material]'),color=section.querySelector('[data-color]'),finish=section.querySelector('[data-finish]'),file=section.querySelector('[data-file]'),status=section.querySelector('[data-status]'),clear=section.querySelector('[data-clear]'),reset=section.querySelector('[data-reset]');
 let current={object:null,slots:[],textures:{},locked:false};
 const profile=(o,id)=>id==='*'?o?.appearance||{}:o?.appearance?.materials?.[id]||{};
 function refresh(state){current=state||current;const {object:o,slots,textures,locked}=current,previous=material.value;material.replaceChildren(new Option('All surfaces','*'),...slots.map((s,i)=>new Option(s.name?`${s.name} · surface ${i+1}`:`Surface ${i+1}`,s.id)));if([...material.options].some(option=>option.value===previous))material.value=previous;else material.value='*';const target=material.value,appearance=profile(o,target);color.value=appearance.color||o?.appearance?.color||'#ffffff';finish.value=appearance.finish||o?.appearance?.finish||'original';const ids=target==='*'?[...new Set(slots.map(s=>o?.appearance?.materials?.[s.id]?.textureId).filter(Boolean))]:[appearance.textureId].filter(Boolean);const textureNames=[...new Set(ids.map(id=>textures?.[id]?.name).filter(Boolean))];const selectedSlot=slots.find(s=>s.id===target);const supportsTexture=target==='*'?slots.length>0&&slots.every(s=>s.uv):!!selectedSlot?.uv;status.textContent=!o?'Select an item to edit its appearance.':!slots.length?'Preparing model surfaces…':!supportsTexture?'This surface has no UV mapping. You can still change its colour and finish.':textureNames.length>1?'Multiple image textures are applied.':textureNames.length?`Texture: ${textureNames[0]}. White tint preserves its original colours.`:'White keeps the model’s original colour. PNG/JPEG up to 2 MB · 4,096 px edge / 12 MP max. Textures require UV mapping.';for(const control of [material,color,finish])control.disabled=!o||locked;file.disabled=!o||locked||!supportsTexture;clear.disabled=!o||locked||!ids.length;reset.disabled=!o||locked||(!o.appearance||(!o.appearance.color&&!o.appearance.finish&&!Object.keys(o.appearance.materials||{}).length));}
 material.onchange=()=>refresh(current);
 color.onchange=()=>{if(current.object)onChange(current.object.id,material.value,'color',color.value);};
 finish.onchange=()=>{if(current.object)onChange(current.object.id,material.value,'finish',finish.value);};
 file.onchange=()=>{const selected=file.files[0],target=material.value,id=current.object?.id;file.value='';if(selected&&id)onUpload(id,target,selected);};
 clear.onclick=()=>{if(current.object)onClear(current.object.id,material.value);};reset.onclick=()=>{if(current.object)onReset(current.object.id,material.value);};
 return {refresh};
}
