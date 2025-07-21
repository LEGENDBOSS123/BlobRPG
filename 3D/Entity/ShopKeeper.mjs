import Composite from "../Physics/Shapes/Composite.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";
import Entity from "./Entity.mjs";
import Quaternion from "../Physics/Math3D/Quaternion.mjs";
import GameObject from "../GameObject.mjs";

var ShopKeeper = class extends Entity {
    constructor(options) {
        super(options);
        this.composite = new Composite({
            local: {
                body: {
                    position: options?.position ?? new Vector3(0, 0, 0),
                }
            }
        });

        this.mainGameObject = new GameObject({
            physics: this.composite,
        })

        this.gameObjects.push(
            this.mainGameObject
        )

        this.size = 0.5;

        this.updateShapeID(this.composite);
        this.composite.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.composite.canCollideWithMask = 0;

        this.waveRadius = 10;
        this.playerNear = false;
        this.playerNearLast = false;
    }

    addToScene(scene) {
        for (var i of this.gameObjects) {
            if (i.mesh) {
                scene.add(i.mesh.mesh);
            }
        }
    }

    async setMeshAndAddToScene(options, gameEngine) {

        const gltf = await gameEngine.graphicsEngine.load("animatedrigged.glb")
        gameEngine.graphicsEngine.makeShadows(gltf.scene);
        gltf.scene.scale.set(this.size, this.size, this.size);

        var meshData = gameEngine.graphicsEngine.meshLinker.createMeshData(gltf.scene, gameEngine.graphicsEngine.createAnimations(gltf.scene, gltf.animations));
        this.mainGameObject.mesh = meshData;
        
        this.playAnimation(this.composite, "IdleAnimation");
        const actions = this.mainGameObject.mesh.animations.actions;
        actions["WaveAnimation"].setLoop(gameEngine.graphicsEngine.THREE.LoopOnce, 1);
        actions["WaveAnimation"].clampWhenFinished = true;
        actions["WaveAnimation"].getMixer().addEventListener('finished', (event) => {
            if (event.action != actions["WaveAnimation"]) {
                return;
            }
            this.playAnimation(this.mainGameObject, "IdleAnimation", 1, false);
        });

        this.addToScene(gameEngine.graphicsEngine.scene);


    }

    addToWorld(world) {
        world.addComposite(this.composite);
        this.updateShapeID();
    }

    updateStep() {
        const entities = this.gameEngine.entitySystem.all;
        let closestDistance = Infinity
        for (const entity of Object.values(entities)) {
            if (!entity.isPlayer) {
                continue;
            }
            const distance = this.composite.global.body.position.distanceSquared(entity.getMainShape().physics.global.body.position);
            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }
        if (closestDistance < this.waveRadius * this.waveRadius) {
            this.playerNear = true;
        }
        else {
            this.playerNear = false;
        }
        if (this.playerNear && !this.playerNearLast) {
            this.playAnimation(this.mainGameObject, "WaveAnimation", 1, false);
        }
        else if (this.currentAnimation?._clip.name != "WaveAnimation") {
            this.playAnimation(this.mainGameObject, "IdleAnimation", 1, false);
        }
        this.playerNearLast = this.playerNear;
    }

    fromMesh(mesh, gameEngine) {

        this.composite.setPosition(Vector3.from(mesh.getWorldPosition(new gameEngine.graphicsEngine.THREE.Vector3())));
        this.composite.global.body.rotation = Quaternion.from(mesh.getWorldQuaternion(new gameEngine.graphicsEngine.THREE.Quaternion()));
        gameEngine.graphicsEngine.disposeMesh(mesh);
    }

    toJSON() {
        var json = super.toJSON();
        this.composite = this.composite.id;
        return json;
    }

    static fromJSON(json, world) {
        var obj = super.fromJSON(json, world);
        obj.composite = json.composite;
        return obj;
    }

    updateReferences() {
        super.updateReferences(gameEngine);
        this.composite = this.gameEngine.world.getByID(this.composite);
    }

    getMainShape() {
        return this.mainGameObject;
    }
}

export default ShopKeeper;