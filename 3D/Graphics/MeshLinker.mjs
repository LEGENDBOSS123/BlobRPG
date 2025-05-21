
var MeshLinker = class {
    constructor() {
        this.meshes = {};
    }

    createMeshData(mesh, animations = []) {
        return {
            mesh: mesh,
            animations: animations,
            id: null,
            isMeshLink: true
        }
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
    update(previousWorld, world, lerpAmount) {
        for (var meshID in this.meshes) {
            if (!world.getByID(meshID) || !previousWorld.all[meshID]) {
                continue;
            }
            var composite = world.getByID(meshID);
            var previousComposite = previousWorld.all[meshID];
            composite.lerpMesh(previousComposite, lerpAmount, previousWorld);
        }
    }
};

export default MeshLinker;