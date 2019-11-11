import * as THREE from 'three';

export class ResourceTracker {
    resources;

    constructor() {
        this.resources = new Set();
    }

    track(resource) {
        if (resource.dispose) {
            if (resource.dispose || resource instanceof THREE.Object3D) {
                this.resources.add(resource);
            }
        }
        return resource;
    }

    untrack(resource) {
        this.resources.delete(resource);
    }

    disposeCount = 0;

    dispose() {
        for (const resource of this.resources) {
            // resource.dispose();
            
            if (resource.parent)
                console.log(resource)
            if (resource instanceof THREE.Object3D) {
                if (resource.parent) {
                    debugger;
                    resource.parent.remove(resource);
                }
            }
            if (resource.dispose) {
                this.disposeCount++;
                resource.dispose();
            }
        }
        this.resources.clear();
    }
}
