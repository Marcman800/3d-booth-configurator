import * as THREE from 'three';
export const lightingDefaults={brightness:1,warmth:0,direction:35,shadows:true};
export function applyLighting(scene,ambient,sun,settings={}){
 const p={...lightingDefaults,...settings};ambient.intensity=2.5*p.brightness;sun.intensity=3*p.brightness;
 sun.color.set(p.warmth==='warm'?'#ffdab0':p.warmth==='cool'?'#c7deff':'#ffffff');
 const angle=p.direction*Math.PI/180;sun.position.set(8*Math.sin(angle),8,8*Math.cos(angle));sun.castShadow=p.shadows;
}
export function installLighting({get,set}){
 const button=document.createElement('button');button.textContent='Lighting';document.querySelector('header').append(button);
 const dialog=document.createElement('dialog');dialog.innerHTML='<div class="modalHead"><h1>Scene lighting</h1><button data-close>Close</button></div><label>Brightness<input data-brightness type="range" min="0.2" max="2" step="0.1"></label><label>Light colour<select data-warmth><option value="neutral">Neutral</option><option value="warm">Warm</option><option value="cool">Cool</option></select></label><label>Light direction · degrees<input data-direction type="range" min="0" max="360" step="5"></label><label><input data-shadows type="checkbox"> Cast shadows</label><p>Saved with your design and used for screenshots, PDF views and videos.</p><button data-reset>Reset lighting</button>';document.body.append(dialog);
 const sync=()=>{const p={...lightingDefaults,...get()};for(const key of Object.keys(lightingDefaults)){const el=dialog.querySelector('[data-'+key+']');if(key==='shadows')el.checked=p[key];else el.value=key==='warmth'?(p[key]||'neutral'):p[key];}};
 button.onclick=()=>{sync();dialog.showModal();};dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('[data-reset]').onclick=()=>{set({...lightingDefaults});sync();};
 for(const key of Object.keys(lightingDefaults))dialog.querySelector('[data-'+key+']').onchange=e=>set({...lightingDefaults,...get(),[key]:key==='shadows'?e.target.checked:key==='warmth'?e.target.value:Number(e.target.value)});
 return button;
}
