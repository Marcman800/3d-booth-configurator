import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
const thumb=(kind)=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" rx="16" fill="#edf0e7"/><ellipse cx="160" cy="170" rx="95" ry="13" fill="#d5ddcf"/>${kind==='flyers'?'<path d="M75 120L175 65 250 110 150 165Z" fill="#ede7d8" stroke="#91a285" stroke-width="5"/><path d="M80 111L175 56 246 99 150 153Z" fill="#fff"/><path d="M108 107L178 67 220 92 150 132Z" fill="#567047"/>':kind==='shelf'?'<path d="M91 40v124M225 40v124" stroke="#35483d" stroke-width="12"/><path d="M85 48h145M85 85h145M85 123h145M85 160h145" stroke="#c2aa83" stroke-width="13"/>':'<path d="M100 65L175 40 225 65 150 90Z" fill="#e0cfb1"/><path d="M100 65L150 90v80l-50-25Z" fill="#c7b391"/><path d="M150 90L225 65v80l-75 25Z" fill="#567047"/><path d="M170 108h36m-36 12h25" stroke="#edf0e7" stroke-width="5"/>'}</svg>`);
const bannerThumb=standing=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" rx="16" fill="#edf0e7"/>${standing?'<rect x="113" y="22" width="94" height="148" fill="#567047"/><path d="M108 174h104" stroke="#47564b" stroke-width="12"/>':'<path d="M65 12v45M255 12v45" stroke="#9aa58e" stroke-width="3"/><rect x="40" y="55" width="240" height="75" fill="#567047"/>'}<text x="160" y="90" fill="#fff" font-family="sans-serif" font-size="18" text-anchor="middle">YOUR BRAND</text></svg>`);
const furnitureThumb=kind=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" rx="16" fill="#edf0e7"/><ellipse cx="160" cy="178" rx="85" ry="10" fill="#d5ddcf"/>${{
 podium:'<path d="M105 66h110v106H105z" fill="white" stroke="#bdc5ba"/><path d="M98 60h124v10H98zM103 172h114v7H103z" fill="#d8ded5"/><text x="160" y="115" text-anchor="middle" fill="#567047" font-family="sans-serif" font-size="13">YOUR BRAND</text>',
 barstool:'<path d="M131 84l-20 91m38-91l-6 91m29-91l9 91m10-91l20 91M121 140h80" stroke="#c7a97a" stroke-width="7"/><path d="M115 66q45 30 90 0l-8 23q-40 18-76-1z" fill="white" stroke="#c4cbc1"/>',
 bartable:'<ellipse cx="160" cy="172" rx="40" ry="7" fill="#9ea8a4"/><path d="M160 68v104" stroke="#9ea8a4" stroke-width="10"/><ellipse cx="160" cy="64" rx="70" ry="13" fill="white" stroke="#c4cbc1"/>',
 walltv:'<rect x="49" y="48" width="222" height="128" rx="5" fill="#22272c"/><rect x="56" y="55" width="208" height="113" fill="#263b48"/><path d="M66 155l72-78 58 49 58-56" fill="none" stroke="#618591" stroke-width="3"/>'
}[kind]}</svg>`);
export const libraryItems=[
 {id:'podium',name:'Reception podium',premium:false,category:'Displays',size:[1000,1050,500],printable:true,description:'White counter with front artwork and raised top/base trim. Approximate concept size; confirm supplier dimensions.',thumbnail:furnitureThumb('podium')},
 {id:'barstool',name:'Timber-leg bar chair',premium:false,category:'Furniture',size:[500,850,500],description:'White curved seat, timber legs and footrests. Approximate 750 mm seat height. Resize in Furnish.',thumbnail:furnitureThumb('barstool')},
 {id:'bartable',name:'Round bar table',premium:false,category:'Furniture',size:[700,1050,700],description:'White circular top with a silver pedestal and disc base. Resize in Furnish.',thumbnail:furnitureThumb('bartable')},
 {id:'walltv',name:'Wall-mounted TV',premium:false,category:'Displays',size:[1100,640,80],description:'Slim screen without a floor stand. Starts on the back wall. Adjust width, height, depth and base elevation in Furnish; unlock proportions for independent sizes. Mounting and wall support require supplier confirmation.',thumbnail:furnitureThumb('walltv')},
 {id:'overhead',name:'Overhead banner',premium:false,category:'Banners',size:[3000,600,40],printable:true,description:'Front artwork · starts above the booth entrance. Adjust base height in Furnish. Concept only: supports, rigging and venue approval are not specified.',thumbnail:bannerThumb(false)},
 {id:'pullup',name:'Freestanding pull-up banner',premium:false,category:'Banners',size:[850,2100,300],printable:true,description:'Front artwork above a floor base. Overall size includes hardware; visible graphic is 850 × 2000 mm at default size. Supplier template required for print.',thumbnail:bannerThumb(true)},
 {id:'plinth',name:'Branded display plinth',premium:false,category:'Displays',size:[500,900,500],printable:true,description:'Artwork on the front face. Centred crop; concept preview only.',thumbnail:thumb('plinth')},
 {id:'shelf',name:'Open display shelves',premium:true,category:'Furniture',size:[1000,1800,400],description:'Four display shelves. Size and position them in Furnish.',thumbnail:thumb('shelf')},
 {id:'flyers',name:'Custom A5 flyer stack',premium:true,category:'Print props',size:[148,20,210],printable:true,description:'Artwork on the top sheet. Set base elevation to your table height in Furnish.',thumbnail:thumb('flyers')}
];
export async function libraryModel(id,artwork,blank=false){
 const scene=new THREE.Scene(),mat=new THREE.MeshStandardMaterial({color:'#d8c8a8',roughness:.7});
 const box=(w,h,d,x,y,z,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),color?new THREE.MeshStandardMaterial({color}):mat);m.position.set(x,y,z);scene.add(m);};
 const item=libraryItems.find(i=>i.id===id);if(!item)throw Error('Unknown library item');
 const mesh=(geometry,color,x,y,z)=>{const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:color==='#aeb7bb'?.3:.65,metalness:color==='#aeb7bb'?.65:0}));m.position.set(x,y,z);scene.add(m);return m;};
 const cylinder=(r,h,x,y,z,color)=>mesh(new THREE.CylinderGeometry(r,r,h,48),color,x,y,z);
 const rod=(a,b,r,color)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=cylinder(r,delta.length(),...start.clone().add(end).multiplyScalar(.5).toArray(),color);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());};
 if(id==='podium'){box(.94,.95,.44,0,.525,0,'#f6f5f0');box(1,.035,.5,0,1.0325,0,'#ffffff');box(.98,.05,.48,0,.025,0,'#e4e5df');}
 if(id==='bartable'){cylinder(.35,.035,0,1.0325,0,'#fafaf5');cylinder(.045,.985,0,.5125,0,'#aeb7bb');cylinder(.23,.025,0,.0125,0,'#aeb7bb');}
 if(id==='barstool'){
  for(const x of [-1,1])for(const z of [-1,1])rod([x*.23,.018,z*.23],[x*.15,.73,z*.15],.018,'#c7a579');
  for(const z of [-1,1])rod([-.204,.25,z*.204],[.204,.25,z*.204],.012,'#c7a579');
  for(const x of [-1,1])rod([x*.204,.25,-.204],[x*.204,.25,.204],.012,'#c7a579');
  const profile=[new THREE.Vector2(0,0),new THREE.Vector2(.12,0),new THREE.Vector2(.2,.025),new THREE.Vector2(.245,.09),new THREE.Vector2(.25,.105),new THREE.Vector2(.24,.11),new THREE.Vector2(.19,.045),new THREE.Vector2(.115,.023),new THREE.Vector2(0,.023)];
  mesh(new THREE.LatheGeometry(profile,48),'#fafaf7',0,.74,0);
 }
 if(id==='walltv'){box(1.1,.64,.05,0,.32,.015,'#20252a');box(.38,.24,.03,0,.32,-.025,'#41484c');box(1.06,.596,.003,0,.327,.0415,'#14232d');box(.012,.003,.002,.49,.014,.042,'#75b6a2');}
 if(id==='plinth')box(.5,.9,.5,0,.45,0);
 if(id==='shelf'){for(const x of [-.48,.48])box(.04,1.8,.4,x,.9,0,'#36483c');for(const y of [.03,.6,1.2,1.77])box(1,.06,.4,0,y,0);}
 if(id==='flyers')box(.148,.02,.21,0,.01,0,'#f2eee5');
 if(id==='overhead')box(3,.6,.04,0,.3,0,'#d8ddcf');
 if(id==='pullup'){box(.85,.08,.3,0,.04,0,'#515c53');box(.85,2,.015,0,1.08,0,'#d8ddcf');box(.85,.02,.025,0,2.09,0,'#515c53');}
 if(item.printable&&!blank){const w=id==='podium'?.94:id==='overhead'?3:id==='pullup'?.85:id==='flyers'?.148:.5,h=id==='podium'?.95:id==='overhead'?.6:id==='pullup'?2:id==='flyers'?.21:.9;const canvas=document.createElement('canvas');canvas.width=Math.round(1024*Math.min(1,w/h));canvas.height=Math.round(1024*Math.min(1,h/w));const ctx=canvas.getContext('2d');ctx.fillStyle='#567047';ctx.fillRect(0,0,canvas.width,canvas.height);
 if(artwork){const img=new Image();img.src=artwork;await img.decode();if(!img.width||!img.height||img.width>16000||img.height>16000)throw Error('Image dimensions are too large.');const scale=Math.max(canvas.width/img.width,canvas.height/img.height);ctx.drawImage(img,(canvas.width-img.width*scale)/2,(canvas.height-img.height*scale)/2,img.width*scale,img.height*scale);}else{ctx.fillStyle='#eef1e6';ctx.font=`bold ${Math.round(Math.min(canvas.width/6,canvas.height/4))}px sans-serif`;ctx.textAlign='center';ctx.fillText('YOUR',canvas.width/2,canvas.height*.43);ctx.fillText('BRAND',canvas.width/2,canvas.height*.65);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:.8}));if(id==='flyers'){plane.rotation.x=-Math.PI/2;plane.position.y=.02001;}else if(id==='overhead')plane.position.set(0,.3,.022);else if(id==='pullup')plane.position.set(0,1.08,.0095);else if(id==='podium')plane.position.set(0,.525,.222);else plane.position.set(0,.45,.25001);scene.add(plane);}
 try{const data=await new GLTFExporter().parseAsync(scene,{binary:true});return {name:item.name,size:[...item.size],data};}finally{scene.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});}
}
