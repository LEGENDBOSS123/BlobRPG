import GameEngineComponent from "../GameEngineComponent.mjs";
import { mergeGeometries } from "../Graphics/three/examples/jsm/utils/BufferGeometryUtils.js"


const ModelPool = class extends GameEngineComponent {
    constructor(options) {
        super(options);
        this.models = new Map();
        this.assetsDirectory = options?.assetsDirectory ?? new URL('.', import.meta.url).href + "Assets/";

    }

    resolvePath(path) {
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('./')) {
            return path;
        }
        return new URL(path, this.assetsDirectory).href;
    }

    clone(gltf) {
        gltf.scene = gltf.scene.clone();
        gltf.animations = gltf.animations.map(function (anim) {
            return anim.clone();
        });
        return gltf;
    }

    // mergeMeshes(object, material) {
    //     const geometriesToMerge = [];
    //     const collectedMaterials = [];

    //     object.traverse(child => {
    //         if (child.isMesh) {
    //             if (child.geometry) {
    //                 const geometry = child.geometry.clone();
    //                 child.updateMatrixWorld(true);
    //                 geometry.applyMatrix4(child.matrixWorld);
    //                 geometriesToMerge.push(geometry);
    //                 if (material === undefined) {
    //                     if (!collectedMaterials.includes(child.material)) {
    //                         collectedMaterials.push(child.material);
    //                     }
    //                 }
    //             }
    //         }
    //     });
    //     if (geometriesToMerge.length === 0) {
    //         return null;
    //     }

    //     const mergedGeometry = mergeGeometries(geometriesToMerge, true);

    //     let finalMaterial = material;
    //     if (finalMaterial === undefined) {
    //         if (collectedMaterials.length > 0) {
    //             // If multiple distinct materials were found, you'll need to decide how to handle them.
    //             // For a single merged mesh, you typically want one material.
    //             // Here, we'll just use the first material found or a default one.
    //             if (collectedMaterials.length === 1) {
    //                 finalMaterial = collectedMaterials[0];
    //             } else {
    //                 console.warn("Multiple distinct materials found. Using a default MeshStandardMaterial. Consider handling materials explicitly.");
    //                 finalMaterial = collectedMaterials[0]; // Default
    //             }
    //         } else {
    //             finalMaterial = new this.gameEngine.graphicsEngine.THREE.MeshStandardMaterial({ color: 0x808080 }); // Fallback default
    //         }
    //     }

    //     const mergedMesh = new this.gameEngine.graphicsEngine.THREE.Mesh(mergedGeometry, finalMaterial);

    //     // If the original 'object' had its own position/rotation/scale,
    //     // the merged mesh's geometry is already in world space relative to (0,0,0).
    //     // So, the new mergedMesh should be at (0,0,0) if it's meant to replace the entire hierarchy.
    //     // If you want the merged mesh to inherit the parent's world transform *after* merging,
    //     // you would compute the inverse of the parent's matrix and apply it to the merged geometry.
    //     // However, the current approach is generally what's desired for a single world-space mesh.
    //     // mergedMesh.position.set(0, 0, 0); // Ensure it's at origin
    //     // mergedMesh.rotation.set(0, 0, 0);
    //     // mergedMesh.scale.set(1, 1, 1);

    //     return mergedMesh;

    // }
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

    async loadInstance(url, estimatedSize = 100, expandSize = null) {
        var path = this.resolvePath(url);
        if (this.models.has(path)) {
            const mesh = this.models.get(path);
            return mesh;
        }
        var gltf = await this.gameEngine.graphicsEngine.load(url);
        const model = this.mergeMeshes(gltf.scene)//.getObjectByProperty('type', 'Mesh');
        console.log(model);
        if (!model) {
            throw new Error(`Model at ${path} does not contain a Mesh object.`);
        }
        const geometry = model.geometry;
        const material = model.material;

        const mesh = this.gameEngine.graphicsEngine.meshLinker.createMeshData(null, null);
        const instancedMesh = new this.gameEngine.graphicsEngine.THREE.InstancedMesh(geometry, material, estimatedSize);
        instancedMesh.frustumCulled = false;
        instancedMesh.instanceMatrix.setUsage(this.gameEngine.graphicsEngine.THREE.DynamicDrawUsage);
        console.log(mesh);
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
    }

    updateCounts() {
        for (const [path, model] of this.models.entries()) {
            if (model.instancedMeshInfo) {
                model.instancedMeshInfo.instancedMesh.count = model.instancedMeshInfo.currentIndex;
                model.instancedMeshInfo.currentIndex = 0;
                // model.instancedMeshInfo.instancedMesh.instanceMatrix.needsUpdate = true;
            }
        }
    }
}

export default ModelPool;