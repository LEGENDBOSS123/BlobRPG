import Composite from "../Physics/Shapes/Composite.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";
import Entity from "./Entity.mjs";

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
        this.size = 1.5;

        this.updateShapeID(this.composite);
        this.composite.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.composite.canCollideWithMask = 0;

        this.waveRadius = 18;
        this.playerNear = false;
        this.playerNearLast = false;
    }


    setMeshAndAddToScene(options, gameEngine) {

        gameEngine.graphicsEngine.load("animatedrigged.glb").then(function (gltf) {
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            gltf.scene.scale.set(this.size, this.size, this.size);

            var meshData = gameEngine.graphicsEngine.meshLinker.createMeshData(gltf.scene,
                gameEngine.graphicsEngine.createAnimations(gltf.scene, gltf.animations));
            this.composite.mesh = meshData;
            this.composite.addToScene(gameEngine);
            this.playAnimation(this.composite, "IdleAnimation");
            const actions = this.composite.mesh.animations.actions;
            console.log(actions)
            actions["WaveAnimation"].setLoop(gameEngine.graphicsEngine.THREE.LoopOnce, 1);
            actions["WaveAnimation"].clampWhenFinished = true;
            actions["WaveAnimation"].getMixer().addEventListener('finished', (event) => {
                if(event.action != actions["WaveAnimation"]){
                    return;
                }
                this.playAnimation(this.composite, "IdleAnimation", 1, false);
            });
        }.bind(this));

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
            const distance = this.composite.global.body.position.distanceSquared(entity.getMainShape().global.body.position);
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
            this.playAnimation(this.composite, "WaveAnimation", 1, false);
        }
        else if(this.currentAnimation?._clip.name != "WaveAnimation"){
            this.playAnimation(this.composite, "IdleAnimation", 1, false);
        }
        this.playerNearLast = this.playerNear;
    }

    fromMesh(mesh, gameEngine) {
        this.composite.setPosition(Vector3.from(mesh.getWorldPosition(new gameEngine.graphicsEngine.THREE.Vector3())));
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
        return this.composite;
    }
}

export default ShopKeeper;