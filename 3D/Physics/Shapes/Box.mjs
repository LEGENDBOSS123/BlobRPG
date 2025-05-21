
import Composite from "./Composite.mjs";
import Matrix3 from "../Math3D/Matrix3.mjs";
import Vector3 from "../Math3D/Vector3.mjs";
import Quaternion from "../Math3D/Quaternion.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";


const Box = class extends Composite {
    static name = "BOX";
    constructor(options) {
        super(options);
        this.width = options?.width ?? 1;
        this.height = options?.height ?? 1;
        this.depth = options?.depth ?? 1;
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);
        this.dimensionsChanged();
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        var I = (1 / 12) * this.local.body.mass * (this.height * this.height + this.depth * this.depth);
        this.local.body.momentOfInertia.set(0, 0, I);
        this.local.body.momentOfInertia.set(1, 1, I);
        this.local.body.momentOfInertia.set(2, 2, I);
        return this.local.body.momentOfInertia;
    }

    calculateLocalHitbox() {
        this.local.hitbox.min = new Vector3(-this.width / 2, -this.height / 2, -this.depth / 2);
        this.local.hitbox.max = new Vector3(this.width / 2, this.height / 2, this.depth / 2);
        return this.local.hitbox;
    }

    calculateGlobalHitbox(forced = false) {
        if(this.sleeping && !forced){
            return;
        }
        var localHitbox = this.local.hitbox;

        var updateForVertex = function (v) {
            this.global.body.rotation.multiplyVector3InPlace(v).addInPlace(this.global.body.position);
            this.global.hitbox.expandToFitPoint(v);
        }.bind(this);

        this.global.hitbox.min = new Vector3(Infinity, Infinity, Infinity);
        this.global.hitbox.max = new Vector3(-Infinity, -Infinity, -Infinity);

        updateForVertex(localHitbox.min.copy());
        updateForVertex(localHitbox.max.copy());
        var vector = new Vector3();
        vector.x = localHitbox.min.x;
        vector.y = localHitbox.min.y;
        vector.z = localHitbox.max.z;
        updateForVertex(vector);
        vector.x = localHitbox.min.x;
        vector.y = localHitbox.max.y;
        vector.z = localHitbox.min.z;
        updateForVertex(vector);
        vector.x = localHitbox.min.x;
        vector.y = localHitbox.max.y;
        vector.z = localHitbox.max.z;
        updateForVertex(vector);
        vector.x = localHitbox.max.x;
        vector.y = localHitbox.min.y;
        vector.z = localHitbox.min.z;
        updateForVertex(vector);
        vector.x = localHitbox.max.x;
        vector.y = localHitbox.min.y;
        vector.z = localHitbox.max.z;
        updateForVertex(vector);
        vector.x = localHitbox.max.x;
        vector.y = localHitbox.max.y;
        vector.z = localHitbox.min.z;
        updateForVertex(vector);
        return this.global.hitbox;
    }

    getVertices() {
        var vertices = [];
        for (var x = -1; x <= 1; x += 2) {
            for (var y = -1; y <= 1; y += 2) {
                for (var z = -1; z <= 1; z += 2) {
                    vertices.push(this.translateLocalToWorld(new Vector3(x * this.width / 2, y * this.height / 2, z * this.depth / 2)));
                }
            }
        }
        return vertices;
    }

    getLocalVertices() {
        var vertices = [];
        for (var x = -1; x <= 1; x += 2) {
            for (var y = -1; y <= 1; y += 2) {
                for (var z = -1; z <= 1; z += 2) {
                    vertices.push(new Vector3(x, y, z));
                }
            }
        }
        return vertices;
    }

    setMesh(options, gameEngine) {
        var geometry = options?.geometry ?? new gameEngine.graphicsEngine.THREE.BoxGeometry(this.width, this.height, this.depth);
        this.mesh = gameEngine.graphicsEngine.meshLinker.createMeshData(new gameEngine.graphicsEngine.THREE.Mesh(geometry, options?.material ?? new gameEngine.graphicsEngine.THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: false })));
    }

    setMeshAndAddToScene(options, gameEngine) {
        this.setMesh(options, gameEngine);
        this.addToScene(gameEngine);
    }

    fromMesh(mesh, gameEngine) {
        var cubeSize = [Math.abs(mesh.geometry.attributes.position.array[0]), Math.abs(mesh.geometry.attributes.position.array[1]), Math.abs(mesh.geometry.attributes.position.array[2])];
        var scale = Vector3.from(mesh.getWorldScale(new gameEngine.graphicsEngine.THREE.Vector3()));
        this.width = Math.abs(scale.x) * 2 * cubeSize[0];
        this.height = Math.abs(scale.y) * 2 * cubeSize[1];
        this.depth = Math.abs(scale.z) * 2 * cubeSize[2];
        
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
        composite.width = this.width;
        composite.height = this.height;
        composite.depth = this.depth;
        return composite;
    }

    static fromJSON(json, world) {
        var box = super.fromJSON(json, world);
        box.width = json.width;
        box.height = json.height;
        box.depth = json.depth;
        return box;
    }
};

ClassRegistry.register(Box);

export default Box;