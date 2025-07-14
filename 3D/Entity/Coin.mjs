import Entity from "./Entity.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";
import Sphere from "../Physics/Shapes/Sphere.mjs";
import Composite from "../Physics/Shapes/Composite.mjs";

const Coin = class extends Entity {
    constructor(options) {
        super(options);
        this.sphere = new Sphere({
            radius: options?.radius ?? 1,
            local: {
                body: {
                    mass: options?.mass ?? 1
                }
            },
            global: {
                body: {
                    position: options?.position,
                    acceleration: new Vector3(0, this.gravity, 0)
                }
            }
        });
        this.value = options?.value ?? 10;
        this.isCoin = true;
        this.collected = options?.collected ?? false;
        this.rotateSpeed = options?.rotateSpeed ?? 0.05;
        this.sphere.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.sphere.isSensor = true;
        this.usesInstancing = true;
        this.sphere.canCollideWithMask = this.sphere.setBitMask(0, "P", true);

        this.postCollision = function (contact) {
            if (this.collected) {
                return;
            }
            var otherBody = null;
            if (contact.body1.maxParent == this.composite) {
                otherBody = contact.body2;
            }
            else {
                otherBody = contact.body1;
            }
            if (this.entitySystem) {
                var entity = this.entitySystem.getEntityFromShape(otherBody);
                if (entity.isPlayer) {
                    entity.cash += this.value;
                    this.collected = true;
                    this.timeCollected = this.sphere.gameEngine.timer.getTime();
                }
            }

        }.bind(this);
        this.sphere.addEventListener("collision", this.postCollision);
        this.updateShapeID(this.sphere);
    }

    addToScene(scene) {
        this.sphere.addToScene(scene);
    }
    addToWorld(world) {
        world.addComposite(this.sphere);
        this.updateShapeID();
    }

    async setMesh(options, gameEngine) {
        const mesh = await gameEngine.graphicsEngine.modelPool.loadInstance("coin.glb");
        this.sphere.mesh = mesh;

    }

    async setMeshAndAddToScene(options, gameEngine) {
        await this.setMesh(options, gameEngine);
        this.addToScene(gameEngine);
    }

    update(gameEngine) {
        if (this.sphere.mesh) {
            const mesh = this.sphere.mesh;
            const info = mesh.instancedMeshInfo;

            if (Number.isFinite(mesh.instancedIndex)) {
                const dummy = info.dummy;
                info.instancedMesh.getMatrixAt(mesh.instancedIndex, dummy.matrix);
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);



                dummy.scale.set(this.sphere.radius, this.sphere.radius, this.sphere.radius);
                if (this.collected) {
                    var timePassed = Math.max(0, (this.gameEngine.timer.getTime() - this.timeCollected) * 0.001) / 0.5;
                   
                    const scale = this.sphere.radius * Math.max(0, 1 - timePassed);

                    dummy.scale.set(scale, scale, scale);
                    if (timePassed >= 1) {
                        this.sphere.disposeMesh();
                        this.gameEngine.entitySystem.remove(this);
                        this.sphere.world.removeComposite(this.sphere);
                        this.sphere.destroy();
                    }
                }

                dummy.updateMatrix();
                info.instancedMesh.setMatrixAt(mesh.instancedIndex, dummy.matrix);
            }
        }

    }

    updateStep(gameEngine) {
        this.sphere.global.body.angularVelocity = new Vector3(0, this.rotateSpeed, 0);
    }

    getMainShape() {
        return this.sphere;
    }

    fromMesh(mesh, gameEngine) {
        this.sphere.radius = mesh.scale.x;
        this.sphere.setPosition(Vector3.from(mesh.getWorldPosition(new gameEngine.graphicsEngine.THREE.Vector3())));
        this.sphere.dimensionsChanged();
        gameEngine.graphicsEngine.disposeMesh(mesh);
        return this;
    }

    updateReferences(gameEngine) {
        this.sphere = gameEngine.world.getByID(this.sphere);
        this.sphere.addEventListener("collision", this.postCollision);
    }
}

export default Coin;