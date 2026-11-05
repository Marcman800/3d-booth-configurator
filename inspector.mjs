// Move live controls rather than cloning them: uploads, history and validation keep one source of truth.
export function installInspector({isReadOnly,getPanel,getObject}){
 const panel=document.createElement('section');panel.className='floatingEditor';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Selection editor');panel.innerHTML='<div class="floatingEditorHead"><strong data-title>Selection editor</strong><button data-fold aria-label="Collapse selection editor">−</button><button data-close aria-label="Close selection editor">×</button></div><div class="floatingEditorBody"></div>';
 document.body.append(panel);const body=panel.querySelector('.floatingEditorBody'),head=panel.querySelector('.floatingEditorHead');let kind=null,moved=[],drag=null;
 const button=document.createElement('button');button.textContent='Selection editor';document.querySelector('header').append(button);
 const $=id=>document.getElementById(id);
 function restore(){document.querySelectorAll('[data-editor-notice]').forEach(n=>n.remove());for(const {node,marker} of moved){marker.replaceWith(node);}moved=[];body.replaceChildren();}
 function move(node){if(!node||moved.some(p=>p.node===node))return;const marker=document.createComment('selection editor home');node.replaceWith(marker);moved.push({node,marker});body.append(node);}
 function heading(text){const h=document.createElement('h2');h.textContent=text;body.append(h);}
 function sync(){const o=getObject();panel.querySelector('[data-title]').textContent=kind==='wall'?'Wall panel · '+getPanel():'Item · '+(o?.name||o?.id||'Add a model');button.hidden=isReadOnly();if(isReadOnly())close();}
 function open(next=kind||'wall'){
 if(isReadOnly())return;if(next===kind&&!panel.hidden){sync();return;}restore();kind=next;panel.hidden=false;body.hidden=false;panel.querySelector('[data-fold]').textContent='−';panel.querySelector('[data-fold]').setAttribute('aria-label','Collapse selection editor');
 if(kind==='wall'){
 heading('Size & panel layout');for(const id of ['wallPanel','panelWidth','panelHeight'])move($(id).closest('label'));
 move($('halfPanel').parentElement);move($('splitPanel').parentElement);
 heading('Artwork & colour');for(const node of [...$('art').children])if(node.tagName!=='H2'&&!node.contains($('panelSelect')))move(node);move($('wallLayoutNote'));
 }else{
 // Preserve all existing item tools, including library uploads and generated-prop artwork.
 move($('objectSelect').closest('label'));move($('objectFields'));move(document.querySelector('[data-art]'));for(const node of [...$('objects').children])move(node);
 }
 const notice=document.createElement('p');notice.dataset.editorNotice='true';notice.className='info';notice.textContent='Editing controls are in the floating selection editor. Close it to return them here.';$(kind==='wall'?'art':'objects').append(notice);sync();body.scrollTop=0;
 }
 function close(){restore();panel.hidden=true;}
 button.onclick=()=>panel.hidden?open():close();panel.querySelector('[data-close]').onclick=close;
 panel.querySelector('[data-fold]').onclick=e=>{body.hidden=!body.hidden;e.currentTarget.textContent=body.hidden?'+':'−';e.currentTarget.setAttribute('aria-label',(body.hidden?'Expand':'Collapse')+' selection editor');};
 const clamp=()=>{const r=panel.getBoundingClientRect();panel.style.left=Math.max(8,Math.min(r.left,innerWidth-r.width-8))+'px';panel.style.top=Math.max(8,Math.min(r.top,innerHeight-Math.min(r.height,80)-8))+'px';panel.style.right='auto';};
 head.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button'))return;const r=panel.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};head.setPointerCapture(e.pointerId);});
 head.addEventListener('pointermove',e=>{if(!drag)return;panel.style.left=e.clientX-drag.x+'px';panel.style.top=e.clientY-drag.y+'px';panel.style.right='auto';clamp();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])head.addEventListener(type,()=>drag=null);
 window.addEventListener('resize',()=>{if(!panel.hidden)clamp();});panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();button.focus();}});
 return {open,close,sync};
}
