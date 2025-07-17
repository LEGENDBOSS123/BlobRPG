
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
        this.localVertices = options?.localVertices ?? [];
        this.globalVertices = options?.globalVertices ?? [];
        this.faces = options?.faces ?? [
            [0, 2, 1], [0, 3, 2], [4, 5, 6],
            [4, 6, 7], [0, 1, 5], [0, 5, 4],
            [2, 3, 7], [2, 7, 6], [0, 4, 7],
            [0, 7, 3], [1, 2, 6], [1, 6, 5],
        ];
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);
        this.dimensionsChanged();
    }


    getVerticesLength() {
        return 8;
    }


    dimensionsChanged() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const halfDepth = this.depth / 2;

        this.localVertices = [
            new Vector3(halfWidth, -halfHeight, halfDepth),
            new Vector3(-halfWidth, -halfHeight, halfDepth),
            new Vector3(-halfWidth, halfHeight, halfDepth),
            new Vector3(halfWidth, halfHeight, halfDepth),
            new Vector3(halfWidth, -halfHeight, -halfDepth),
            new Vector3(-halfWidth, -halfHeight, -halfDepth),
            new Vector3(-halfWidth, halfHeight, -halfDepth),
            new Vector3(halfWidth, halfHeight, -halfDepth)
        ];
        super.dimensionsChanged();
    }

    supportFunction(direction) {
        const localDirection = this.global.body.rotation.conjugate().multiplyVector3(direction);
        let supportVertex = new Vector3(
            localDirection.x > 0 ? this.width / 2 : -this.width / 2,
            localDirection.y > 0 ? this.height / 2 : -this.height / 2,
            localDirection.z > 0 ? this.depth / 2 : -this.depth / 2
        );
        return this.translateLocalToWorld(supportVertex);
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        var I = (1 / 12) * this.local.body.mass * (this.height * this.height + this.depth * this.depth);
        this.local.body.momentOfInertia.set(0, 0, I);
        this.local.body.momentOfInertia.set(1, 1, I);
        this.local.body.momentOfInertia.set(2, 2, I);
        return this.local.body.momentOfInertia;
    }

    supportAlongAxis(axis, center) {
        const rot = this.global.body.rotation;
        const inv = rot.conjugate();
        const localAxis = inv.multiplyVector3(axis);

        const hw = this.width * 0.5;
        const hh = this.height * 0.5;
        const hd = this.depth * 0.5;

        const sign = localAxis.sign();
        const support = new Vector3(hw * sign.x, hh * sign.y, hd * sign.z);
        const world = rot.multiplyVector3(support).add(center);

        return {
            max: world.dot(axis),
            min: world.dot(axis) - 2 * Math.abs(localAxis.dot(support))
        };
    }

    calculateLocalHitbox() {
        this.local.hitbox.min = new Vector3(-this.width / 2, -this.height / 2, -this.depth / 2);
        this.local.hitbox.max = new Vector3(this.width / 2, this.height / 2, this.depth / 2);
        return this.local.hitbox;
    }

    calculateGlobalVertices() {
        this.globalVertices.length = this.localVertices.length;
        for (var i = 0; i < this.localVertices.length; i++) {
            this.globalVertices[i] = this.translateLocalToWorld(this.localVertices[i]);
        }
    }

    calculateGlobalHitbox(forced = false) {
        if (this.sleeping && !forced) {
            return;
        }
        this.calculateGlobalVertices();
        this.global.hitbox.min = new Vector3(Infinity, Infinity, Infinity);
        this.global.hitbox.max = new Vector3(-Infinity, -Infinity, -Infinity);
        for (var v of this.globalVertices) {
            this.global.hitbox.expandToFitPoint(v);
        }
        return this.global.hitbox;
    }


    setMesh(options, gameEngine) {
        var geometry = options?.geometry ?? new gameEngine.graphicsEngine.THREE.BoxGeometry(this.width, this.height, this.depth);
        this.mesh = gameEngine.graphicsEngine.meshLinker.createMeshData(new gameEngine.graphicsEngine.THREE.Mesh(geometry, options?.material ?? new gameEngine.graphicsEngine.THREE.MeshPhongMaterial({ color: options?.color ?? 0x00ff00, wireframe: false })));
        gameEngine.graphicsEngine.makeShadows(this.mesh.mesh);
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

    static fromJSON(json, gameEngine) {
        var box = super.fromJSON(json, gameEngine);
        box.width = json.width;
        box.height = json.height;
        box.depth = json.depth;
        box.dimensionsChanged();
        return box;
    }
};

ClassRegistry.register(Box);

export default Box;