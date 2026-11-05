export function projectContent(project){const p=structuredClone(project);delete p.workspaceId;delete p.workspaceVersion;return JSON.stringify(p);}
export class SaveState {
 baseline=null;busy=false;error='';
 saved(project){this.baseline=projectContent(project);this.error='';}
 dirty(project){return Boolean(project.workspaceId)&&this.baseline!==projectContent(project);}
 text(project){if(this.busy)return 'Saving to My projects…';if(this.error)return 'Save failed — '+this.error;if(!project.workspaceId)return 'Not saved to My projects';return this.dirty(project)?'Unsaved changes · auto-save in about 1.5 seconds':'Saved to My projects · auto-save on';}
}
