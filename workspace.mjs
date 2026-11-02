export function reviewStatus(revision){
 if(!revision)return 'Draft';
 const decision=[...revision.events].reverse().find(e=>['approve','changes'].includes(e.kind));
 return decision?.kind==='approve'?'Approved':decision?.kind==='changes'?'Changes requested':'Awaiting review';
}
export function reviewContent(project){const p=structuredClone(project);delete p.workspaceId;delete p.workspaceVersion;p.email='';p.notes='';return p;}
