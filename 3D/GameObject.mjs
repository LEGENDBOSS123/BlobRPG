import GameEngineComponent from "./GameEngineComponent.mjs";
import Constraint from "./Physics/Collision/Constraint.mjs";
import Quaternion from "./Physics/Math3D/Quaternion.mjs";
import Vector3 from "./Physics/Math3D/Vector3.mjs";

class GameObject extends GameEngineComponent {
    constructor(options) {
        super(options);
        this.mesh = options?.mesh ?? null;
        this.physics = options?.physics ?? null;
        this.id = -1;
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
        if (!mesh) {
            return;
        }
        if (mesh.instancedMeshInfo) {
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


    setMesh() {

    }

    setMeshAndAddToScene(gameEngine) {

    }

    addToScene(gameEngine) {
        if (!this.mesh) {
            return null;
        }
        if (this.mesh.isMeshLink) {
            if (this.mesh.instancedMeshInfo) {
                return gameEngine.graphicsEngine.scene.add(this.mesh.instancedMeshInfo.instancedMesh);
            }
            gameEngine.graphicsEngine.scene.add(this.mesh.mesh);
            return;
        }
        gameEngine.graphicsEngine.scene.add(this.mesh);
    }

    addToWorld(world) {

    }

    lerpMesh(last, lerp, previousWorld) {
        if (!this.mesh || !this.physics) {
            return;
        }

        if (this.mesh.instancedMeshInfo) {
            if (!this.mesh.instancedMeshVisible) {
                return;
            }
            const index = this.mesh.instancedMeshInfo.getIndex(this.gameEngine);
            this.mesh.instancedIndex = index;
            const instancedMesh = this.mesh.instancedMeshInfo.instancedMesh;
            const dummy = this.mesh.instancedMeshInfo.dummy;

            dummy.position.set(...this.physics.global.body.position.lerp(last.global.body.position, 1 - lerp));
            const quat = this.physics.global.body.rotation.slerp(last.global.body.rotation, 1 - lerp);
            dummy.quaternion.set(...[quat.x, quat.y, quat.z, quat.w]);
            dummy.scale.set(1, 1, 1);

            dummy.updateMatrix();

            instancedMesh.setMatrixAt(index, dummy.matrix);
            return;
        }
        if (!this.mesh.mesh) {
            return;
        }
        if (this.physics instanceof Constraint) {
            var lastbody1 = previousWorld.all[last?.body1];
            var lastbody2 = previousWorld.all[last?.body2];
            if (!lastbody1 || !lastbody2 || !this.physics.body1 || !this.physics.body2) {
                return null;
            }
            var lastPoints = [Vector3.fromJSON(lastbody1.global.body.position).add(Quaternion.fromJSON(lastbody1.global.body.rotation).multiplyVector3(last.anchor1)),
            Vector3.fromJSON(lastbody2.global.body.position).add(Quaternion.fromJSON(lastbody2.global.body.rotation).multiplyVector3(last.anchor2))
            ]
            var points = this.physics.getPoints();
            var lerped = [
                lastPoints[0].lerp(points[0], lerp),
                lastPoints[1].lerp(points[1], lerp)
            ];
            
            this.mesh.mesh.geometry.setFromPoints(lerped);
            this.mesh.mesh.geometry.attributes.position.needsUpdate = true;
            return;
        }
        this.mesh.mesh.position.set(...this.physics.global.body.position.lerp(last.global.body.position, 1 - lerp));
        const quat = this.physics.global.body.rotation.slerp(last.global.body.rotation, 1 - lerp);
        this.mesh.mesh.quaternion.set(...[quat.x, quat.y, quat.z, quat.w]);
    }
   
}


export default GameObject;