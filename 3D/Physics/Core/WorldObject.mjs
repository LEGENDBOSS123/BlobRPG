import ClassRegistry from "./ClassRegistry.mjs";

const WorldObject = class {

    static name = "WORLDOBJECT";

    constructor(options) {
        this.id = options?.id ?? -1;
        this.type = ClassRegistry.getTypeFromName(this.constructor.name);
        this.name = options?.name ?? "";

        this.events = {};
        this.toBeRemoved = options?.toBeRemoved ?? false;

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
        json.toBeRemoved = this.toBeRemoved ?? false;
        return json;
    }

    static fromJSON(json, gameEngine) {
        var worldObject = new this();
        worldObject.id = json.id;
        worldObject.world = gameEngine.world;
        worldObject.toBeRemoved = json.toBeRemoved;
        worldObject.gameEngine = gameEngine;
        return worldObject;
    }

    updateReferences(gameEngine = this.gameEngine) {

    }

}


ClassRegistry.register(WorldObject);


export default WorldObject;