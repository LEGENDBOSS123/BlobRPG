class ItemMeshManager {

    static meshes = {};

    static async loadItem(itemConstructor, gameEngine) {
        const path = itemConstructor.modelPath;
        const gltf = await gameEngine.graphicsEngine.load(path);
        this.meshes[itemConstructor] = gltf.scene;
        return this.copy(gltf.scene, gameEngine);
    }

    static copy(mesh, gameEngine) {
        return mesh.clone();
        const newMesh = new gameEngine.graphicsEngine.THREE.Mesh(mesh.geometry, mesh.material);
        return newMesh;
    }

    static get(itemConstructor, gameEngine) {
        return this.copy(this.meshes[itemConstructor], gameEngine);
    }

    static has(itemConstructor) {
        if (this.meshes[itemConstructor]) {
            return true;
        }
        return false;
    }
}


export default ItemMeshManager;