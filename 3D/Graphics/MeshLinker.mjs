
var MeshLinker = class {
    constructor() {
        this.meshes = {};
    }

    createMeshData(mesh, animations = []) {
        return {
            mesh: mesh,
            animations: animations,
            id: null,
            isMeshLink: true,
            instancedMeshInfo: null,
            instancedIndex: null,
            instancedMeshVisible: true
        }
    }

    createInstancedMeshData(meshInfo){
        let meshdata = this.createMeshData(null, null);
        meshdata.instancedMeshInfo = meshInfo;
        return meshdata;
    }


    addMesh(id, mesh) {
        this.meshes[id] = mesh;
        mesh.id = id;
    }
    
    removeMesh(id) {
        if (!this.meshes[id]) {
            return;
        }
        delete this.meshes[id];
    }
    getByID(id) {
        return this.meshes[id];
    }
    update(gameEngine, previousWorld, world, lerpAmount) {
        for (var meshID in this.meshes) {
            const object = gameEngine.getByID(meshID);
            const physicsObject = object.physics;
            if(!physicsObject){
                continue;
            }
            if (!world.getByID(physicsObject.id) || !previousWorld.all[physicsObject.id]) {
                continue;
            }
            var composite = physicsObject;
            var previousComposite = previousWorld.all[physicsObject.id];
            object.lerpMesh(previousComposite, lerpAmount, previousWorld);
        }
    }
};

export default MeshLinker;