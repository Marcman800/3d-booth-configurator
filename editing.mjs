export class History {
 // serialise turns a state into the stored string; record() also accepts a string the caller already made, so one edit is serialised once.
 constructor(limit=20,maxBytes=64*1024*1024,serialise=JSON.stringify){this.limit=limit;this.maxBytes=maxBytes;this.serialise=serialise;this.past=[];this.future=[];this.current=null;this.pastBytes=0;}
 reset(state){this.current=this.serialise(state);this.past=[];this.future=[];this.pastBytes=0;}
 record(state,next=this.serialise(state)){if(next===this.current)return false;if(this.current!==null){this.past.push(this.current);this.pastBytes+=this.current.length;}this.current=next;this.future=[];while(this.past.length&&(this.past.length>this.limit||this.pastBytes+next.length>this.maxBytes))this.pastBytes-=this.past.shift().length;return true;}
 undo(){if(!this.past.length)return null;this.future.push(this.current);this.current=this.past.pop();this.pastBytes-=this.current.length;return JSON.parse(this.current);}
 redo(){if(!this.future.length)return null;this.past.push(this.current);this.pastBytes+=this.current.length;this.current=this.future.pop();return JSON.parse(this.current);}
}
export function draftStore(){let db;async function open(){if(db)return db;db=await new Promise((resolve,reject)=>{const r=indexedDB.open('forma-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return db;}return {async read(){const d=await open();return new Promise((resolve,reject)=>{const r=d.transaction('drafts').objectStore('drafts').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});},async write(state,key='current'){const d=await open();return new Promise((resolve,reject)=>{const tx=d.transaction('drafts','readwrite');tx.objectStore('drafts').put(state,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});},
 // A draft that no longer validates is copied aside before the next autosave can replace it.
 keepUnreadable(state){return this.write(state,'unreadable');}};}
