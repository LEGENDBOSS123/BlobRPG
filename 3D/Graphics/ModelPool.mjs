import GameEngineComponent from "../GameEngineComponent.mjs";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"


const ModelPool = class extends GameEngineComponent {
    constructor(options) {
        super(options);
        this.models = new Map();
        this.cachedPromises = new Map();
        this.assetsDirectory = options?.assetsDirectory ?? new URL('.', import.meta.url).href + "Assets/";

    }

    resolvePath(path) {
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('./')) {
            return path;
        }
        return new URL(path, this.assetsDirectory).href;
    }


    mergeMeshes(mesh) {
        const meshes = [];
        mesh.traverse((child) => {
            if (child.isMesh) {
                meshes.push(child);
            }
        });
        const geometries = [];
        const materials = [];

        for (const mesh of meshes) {
            const geom = mesh.geometry.clone();
            geom.applyMatrix4(mesh.matrixWorld);
            const count = geom.index ? geom.index.count : geom.attributes.position.count;

            geom.groups = [{
                start: 0,
                count: count,
                materialIndex: materials.length,
            }];

            geometries.push(geom);
            materials.push(mesh.material);
        }

        const mergedGeometry = mergeGeometries(geometries, true);
        return new this.gameEngine.graphicsEngine.THREE.Mesh(mergedGeometry, materials);
    }

    get() {

    }

    loadInstance(url, estimatedSize = 100, expandSize = null) {
        const path = this.resolvePath(url);

        return new Promise(async function (resolve, reject) {
            if (this.models.has(path)) {
                const mesh = this.models.get(path);
                const newMesh = this.gameEngine.graphicsEngine.meshLinker.createMeshData(null, null);
                newMesh.instancedMeshInfo = mesh.instancedMeshInfo;
                resolve(newMesh);
                return;
            }
            if (this.cachedPromises.has(path)) {
                const mesh = await this.cachedPromises.get(path);
                // console.log(this.cachedPromises.get(path), mesh);
                const newMesh = this.gameEngine.graphicsEngine.meshLinker.createMeshData(null, null);
                newMesh.instancedMeshInfo = mesh.instancedMeshInfo;
                resolve(newMesh);
                return;
            }

            const loadPromise = this.gameEngine.graphicsEngine.load(url).then(function (gltf) {
                const model = this.mergeMeshes(gltf.scene)
                if (!model) {
                    throw new Error(`Model at ${path} does not contain a Mesh object.`);
                }
                const geometry = model.geometry;
                const material = model.material;

                const mesh = this.gameEngine.graphicsEngine.meshLinker.createMeshData(null, null);
                const instancedMesh = new this.gameEngine.graphicsEngine.THREE.InstancedMesh(geometry, material, estimatedSize);
                instancedMesh.frustumCulled = false;
                instancedMesh.instanceMatrix.setUsage(this.gameEngine.graphicsEngine.THREE.DynamicDrawUsage);
                instancedMesh.castShadow = true;
                instancedMesh.receiveShadow = true;

                mesh.instancedMeshInfo = {
                    instancedMesh: instancedMesh,
                    currentIndex: 0,
                    totalSize: estimatedSize,
                    expandSize: expandSize ?? estimatedSize,
                    dummy: new this.gameEngine.graphicsEngine.THREE.Object3D(),
                    getIndex: function (gameEngine) {
                        if (this.currentIndex < this.totalSize) {
                            return this.currentIndex++;
                        }
                        else {
                            this.expand(this.expandSize + this.totalSize, gameEngine);
                            return this.currentIndex++;
                        }
                    },
                    expand: function (newSize, gameEngine) {
                        if (newSize <= this.totalSize) {
                            return;
                        }
                        const newInstancedMesh = new gameEngine.graphicsEngine.THREE.InstancedMesh(this.instancedMesh.geometry, this.instancedMesh.material, newSize);
                        newInstancedMesh.castShadow = this.instancedMesh.castShadow;
                        newInstancedMesh.receiveShadow = this.instancedMesh.receiveShadow;
                        newInstancedMesh.frustumCulled = false;
                        const tempMatrix = new gameEngine.graphicsEngine.THREE.Matrix4();
                        for (let i = 0; i < this.currentIndex; i++) {
                            this.instancedMesh.getMatrixAt(i, tempMatrix);
                            newInstancedMesh.setMatrixAt(i, tempMatrix);
                        }
                        newInstancedMesh.instanceMatrix.needsUpdate = true;
                        newInstancedMesh.instanceMatrix.setUsage(gameEngine.graphicsEngine.THREE.DynamicDrawUsage);
                        if (this.instancedMesh.instanceColor) {
                            newInstancedMesh.instanceColor = this.instancedMesh.instanceColor;
                            newInstancedMesh.instanceColor.needsUpdate = true;
                        }
                        const parent = this.instancedMesh.parent;
                        if (parent) {
                            parent.add(newInstancedMesh);
                            parent.remove(this.instancedMesh);
                        }
                        this.instancedMesh = newInstancedMesh;
                        this.totalSize = newSize;

                    }
                }
                this.models.set(path, mesh);
                
                return mesh;
            }.bind(this));

            this.cachedPromises.set(path, loadPromise);

            resolve(await loadPromise);
            return;
        
        }.bind(this));
    }

    updateCounts() {
        for (const [path, model] of this.models.entries()) {
            if (model.instancedMeshInfo) {
                model.instancedMeshInfo.instancedMesh.count = model.instancedMeshInfo.currentIndex;
                model.instancedMeshInfo.currentIndex = 0;
                model.instancedMeshInfo.instancedMesh.instanceMatrix.needsUpdate = true;
            }
        }
    }
}

export default ModelPool;