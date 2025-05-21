import Composite from "./Composite.mjs";
import Vector3 from "../Math3D/Vector3.mjs";
import Matrix3 from "../Math3D/Matrix3.mjs";
import Quaternion from "../Math3D/Quaternion.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";
const Sphere = class extends Composite {

    static name = "SPHERE";

    constructor(options) {
        super(options);
        this.radius = options?.radius ?? 1;
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);
        this.dimensionsChanged();
    }

    calculateLocalHitbox() {
        this.local.hitbox.min = new Vector3(-this.radius, -this.radius, -this.radius);
        this.local.hitbox.max = new Vector3(this.radius, this.radius, this.radius);
        return this.hitbox;
    }

    calculateGlobalHitbox(forced = false) {
        if (this.sleeping && !forced) {
            return;
        }
        this.global.hitbox.min = this.local.hitbox.min.add(this.global.body.position);
        this.global.hitbox.max = this.local.hitbox.max.add(this.global.body.position);
        return this.global.hitbox;
    }

    rotateLocalMomentOfInertia(quaternion) {
        return this.local.body.momentOfInertia;
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        var I = (2 / 5) * this.local.body.mass * this.radius * this.radius;
        this.local.body.momentOfInertia.set(0, 0, I);
        this.local.body.momentOfInertia.set(1, 1, I);
        this.local.body.momentOfInertia.set(2, 2, I);
        return this.local.body.momentOfInertia;
    }

    setMesh(options, gameEngine) {
        var geometry = options?.geometry ?? new gameEngine.graphicsEngine.THREE.SphereGeometry(this.radius, 32, 32);
        this.mesh = gameEngine.graphicsEngine.meshLinker.createMeshData(new gameEngine.graphicsEngine.THREE.Mesh(geometry, options?.material ?? new gameEngine.graphicsEngine.THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true })));
    }

    setMeshAndAddToScene(options, gameEngine) {
        this.setMesh(options, gameEngine);
        this.addToScene(gameEngine);
    }

    fromMesh(mesh, gameEngine) {
        var scale = Vector3.from(mesh.getWorldScale(new gameEngine.graphicsEngine.THREE.Vector3()));
        this.radius = scale.x;

        var pos = Vector3.from(mesh.getWorldPosition(new gameEngine.graphicsEngine.THREE.Vector3()));
        var quat = Quaternion.from(mesh.getWorldQuaternion(new gameEngine.graphicsEngine.THREE.Quaternion()));
        this.global.body.rotation = quat;
        this.global.body.setPosition(pos);
        this.global.body.actualPreviousPosition = this.global.body.position.copy();
        this.global.body.previousRotation = this.global.body.rotation.copy();
        this.dimensionsChanged();
        return this;
    }

    toJSON() {
        var composite = super.toJSON();
        composite.radius = this.radius;
        return composite;
    }

    static fromJSON(json, world) {
        var sphere = super.fromJSON(json, world);
        sphere.radius = json.radius;
        return sphere;
    }
};

ClassRegistry.register(Sphere);

export default Sphere;