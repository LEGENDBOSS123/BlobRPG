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
        this.value = options?.value ?? 1;
        this.isCoin = true;
        this.collected = options?.collected ?? false;
        this.rotateSpeed = options?.rotateSpeed ?? 0.05;
        this.sphere.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.sphere.isSensor = true;
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
                    entity.money += this.value;
                    this.sphere.toBeRemoved = true;
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

    setMeshAndAddToScene(options, gameEngine) {
        if (this.sphere.mesh) {
            return;
        }
        gameEngine.graphicsEngine.load("coin.glb").then(function (gltf) {
            gltf.scene.scale.set(this.sphere.radius, this.sphere.radius, this.sphere.radius);
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })
            this.sphere.mesh = gameEngine.graphicsEngine.meshLinker.createMeshData(gltf.scene);
            this.addToScene(gameEngine);
        }.bind(this))
    }

    update(gameEngine) {
        if (this.collected && this.sphere.mesh) {
            var timePassed = Math.max(0, (this.sphere.gameEngine.timer.getTime() - this.timeCollected) * 0.001);
            var timeOpacity = 0.5;
            this.sphere.mesh.mesh.children[0].material.transparent = true;
            this.sphere.mesh.mesh.children[0].material.alphaTest = 0.001;
            this.sphere.mesh.mesh.children[0].material.opacity = Math.max(0, 1 - timePassed / timeOpacity);
            this.sphere.mesh.mesh.scale.x = this.sphere.radius * Math.max(0, 1 - timePassed / timeOpacity);
            this.sphere.mesh.mesh.scale.y = this.sphere.radius * Math.max(0, 1 - timePassed / timeOpacity);
            this.sphere.mesh.mesh.scale.z = this.sphere.radius * Math.max(0, 1 - timePassed / timeOpacity);
            if (this.sphere.mesh.mesh.children[0].material.opacity <= 0) {
                this.sphere.disposeMesh();
                this.sphere.gameEngine.entitySystem.remove(this);
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
        return this;
    }

    updateReferences(gameEngine) {
        this.sphere = gameEngine.world.getByID(this.sphere);
        this.sphere.addEventListener("collision", this.postCollision);
    }
}

export default Coin;