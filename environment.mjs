import * as THREE from 'three';
// Decorative venue, isolated from booth picking, dimensions and technical elevations.
export function exhibitionHall(){
 const hall=new THREE.Group();hall.name='Exhibition hall backdrop';
 const materials=new Map();const material=(colour,glow=false)=>{const key=colour+glow;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:colour,roughness:.85,...(glow?{emissive:colour,emissiveIntensity:.7}:{})}));return materials.get(key);};
 const box=(w,h,d,x,y,z,c,glow=false)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c,glow));m.position.set(x,y,z);m.receiveShadow=true;hall.add(m);return m;};
 box(64,.1,64,0,-.16,0,'#c2c5c2');
 for(let n=-30;n<=30;n+=3){box(.012,.002,64,n,-.108,0,'#aeb6b2');box(64,.002,.012,0,-.108,n,'#aeb6b2');}
 box(64,12,.25,0,5.9,-32,'#e0e3df');box(64,12,.25,0,5.9,32,'#e0e3df');box(.25,12,64,-32,5.9,0,'#d4dad7');box(.25,12,64,32,5.9,0,'#d4dad7');
 box(64,.2,64,0,12,0,'#ced3ce');
 for(let x=-28;x<=28;x+=7){for(const z of [-31.7,31.7]){box(.4,12,.5,x,5.9,z,'#89968f');box(5.6,4,.08,x,7.3,z+(z<0?.3:-.3),'#b7d6df',true);box(5.6,.08,.1,x,7.3,z+(z<0?.36:-.36),'#81958e');}box(.22,.45,64,x,11.5,0,'#83918a');}
 for(let z=-28;z<=28;z+=7){box(64,.35,.2,0,11.1,z,'#939f98');for(let x=-24;x<=24;x+=8)box(3,.05,.45,x,10.85,z,'#fff4d9',true);}
 for(const x of [-18,18])for(const z of [-18,18])box(.6,11.3,.6,x,5.55,z,'#a5b0aa');
 // Distant closed loading doors establish scale without implying a particular venue.
 for(const x of [-20,0,20]){box(4,3.5,.12,x,1.65,-31.8,'#84958f');for(let y=.2;y<3.3;y+=.35)box(3.9,.025,.14,x,y,-31.7,'#71857b');}
 hall.traverse(o=>o.layers.set(2));return hall;
}
