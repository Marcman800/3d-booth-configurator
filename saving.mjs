// Project JSON without the server's workspace fields. A shallow spread avoids deep-copying embedded artwork and models.
export function projectContent(project){return JSON.stringify({...project,workspaceId:undefined,workspaceVersion:undefined});}
export class SaveState {
 baseline=null;busy=false;error='';
 saved(project){this.baseline=projectContent(project);this.error='';}
 dirty(project,content){return Boolean(project.workspaceId)&&this.baseline!==(content??projectContent(project));}
 text(project,content){if(this.busy)return 'Saving to My projects…';if(this.error)return 'Save failed — '+this.error;if(!project.workspaceId)return 'Not saved to My projects';return this.dirty(project,content)?'Unsaved changes · auto-save in about 1.5 seconds':'Saved to My projects · auto-save on';}
}
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
// True when an unnamed draft is indistinguishable from a fresh project, so saving it would only create an empty named copy.
export function isPristineDraft(project,fresh){return !project.workspaceId&&JSON.stringify(canonical(JSON.parse(projectContent(project))))===JSON.stringify(canonical(JSON.parse(projectContent(fresh))));}
