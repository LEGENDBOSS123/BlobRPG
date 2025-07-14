import ClassRegistry from "./ClassRegistry.mjs";

const WorldObject = class {

    static name = "WORLDOBJECT";

    constructor(options) {
        this.id = options?.id ?? -1;
        this.type = ClassRegistry.getTypeFromName(this.constructor.name);
        this.name = options?.name ?? "";

        this.events = {};
        this.toBeRemoved = options?.toBeRemoved ?? false;
        this.world = options?.world ?? null;
        this.gameEngine = options?.gameEngine ?? null;
        this._mesh = options?.mesh ?? null;
    }

    addEventListener(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (!this.events[event]) {
            return;
        }
        var index = this.events[event].indexOf(callback);
        if (index == -1) {
            return;
        }
        this.events[event].splice(index, 1);
        if (this.events[event].length == 0) {
            delete this.events[event];
        }
    }

    dispatchEvent(event, args = []) {
        if (!this.events[event]) {
            return;
        }
        for (var listener in this.events[event]) {
            this.events[event][listener](...args);
        }
    }

    setMesh(options, gameEngine) {
        return null;
    }

    setMeshAndAddToScene(options, gameEngine) {
        return null;
    }

    addToScene(gameEngine) {
        if (!this.mesh) {
            return null;
        }
        if (this.mesh.isMeshLink) {
            if(this.mesh.instancedMeshInfo){
                return  gameEngine.graphicsEngine.scene.add(this.mesh.instancedMeshInfo.instancedMesh);
            }
            gameEngine.graphicsEngine.scene.add(this.mesh.mesh);
            return;
        }
        gameEngine.graphicsEngine.scene.add(this.mesh);
    }

    lerpMesh(last, lerp) {
        return null;
    }

    set mesh(value) {
        if (this.id == -1 || !value) {
            this._mesh = value;
            return;
        }
        this.gameEngine.graphicsEngine.meshLinker.addMesh(this.id, value);
    }

    get mesh() {
        if (this.id == -1) {
            return this._mesh;
        }
        return this.gameEngine.graphicsEngine.meshLinker.getByID(this.id) || this._mesh;
    }

    disposeMesh() {
        var mesh = this.mesh?.mesh || this._mesh || null;
        if(!mesh){
            return;
        }
        if(mesh.instancedMeshInfo){
            return;
        }
        mesh.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }

                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }

                if (child.material?.map) {
                    child.material.map.dispose();
                }
            }
        });

        if (mesh.parent) {
            mesh.parent.remove(mesh);
        }
    }

    toJSON() {
        var json = {};
        json.id = this.id;
        json.type = this.type;
        json.name = this.name;
        json.toBeRemoved = this.toBeRemoved;
        return json;
    }

    static fromJSON(json, gameEngine) {
        var worldObject = new this();
        worldObject.id = json.id;
        worldObject.type = json.type;
        worldObject.name = json.name;
        worldObject.toBeRemoved = json.toBeRemoved;
        worldObject.gameEngine = gameEngine;
        return worldObject;
    }

    updateReferences(gameEngine = this.gameEngine) {
        this.world = gameEngine.world;
        this.gameEngine = gameEngine || this.gameEngine;
    }

    destroy() {
        this.world = null;
        this.id = -1;
        this.toBeRemoved = false;
        this.gameEngine = null;
        this.mesh = null;
        this.events = {};
    }
}


ClassRegistry.register(WorldObject);


export default WorldObject;