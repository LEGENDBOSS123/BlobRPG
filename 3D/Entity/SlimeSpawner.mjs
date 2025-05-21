import Composite from "../Physics/Shapes/Composite.mjs";
import Sphere from "../Physics/Shapes/Sphere.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";
import Entity from "./Entity.mjs";
var SlimeSpawner = class extends Entity {
    constructor(options) {
        super(options);
        this.sphere = new Sphere(options?.sphere);
        this.sphere.radius = 15;
        this.sphere.local.body.mass = Infinity;
        this.sphere.dimensionsChanged();

        this.sphere.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.sphere.setRestitution(0);
        this.sphere.setFriction(0);
        this.updateShapeID(this.sphere);
    }

    addToScene(gameEngine) {
        this.sphere.addToScene(gameEngine);
    }

    addToWorld(world) {
        world.addComposite(this.sphere);
        this.updateShapeID(this.sphere);
    }

    setMeshAndAddToScene(options, gameEngine) {
        gameEngine.graphicsEngine.load("slimeSpawner.glb", function (gltf) {
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })
            this.sphere.mesh = gameEngine.graphicsEngine.meshLinker.createMeshData(gltf.scene);
            this.addToScene(gameEngine);
        }.bind(this));
    }

    toJSON() {
        var json = {};
        json.sphere = this.sphere.id;
        return json;
    }

    static fromJSON(json, world) {
        var slimeSpawner = new this();
        this.sphere = json.sphere;
        return slimeSpawner;
    }

    updateReferences(gameEngine) {
        this.sphere = gameEngine.world.getByID(this.sphere);
    }

    spawnSlime(slimeClass, gameEngine) {
        var slime = new slimeClass({
            sphere: {
                global: {
                    body: {
                        position: this.sphere.global.body.position.add(new Vector3(0, 10, 0)),
                        acceleration: new Vector3(0, -0.2, 0),
                    }
                }
            }
        });
        slime.addToWorld(gameEngine.world);
        this.entitySystem.register(slime);
        slime.setMeshAndAddToScene({}, gameEngine);
        return slime;
    }
    getMainShape() {
        return this.sphere;
    }
}

export default SlimeSpawner;