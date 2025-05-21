import Composite from "./Composite.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";

const Point = class extends Composite {
    static name = "POINT";
    constructor(options) {
        super(options);
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);
        this.dimensionsChanged();
    }

    rotateLocalMomentOfInertia(quaternion) {
        return this.local.body.momentOfInertia;
    }

    setMesh(options, graphicsEngine) {
        var geometry = options?.geometry ?? new graphicsEngine.THREE.SphereGeometry(options?.radius ?? 1, 16, 16);
        this.mesh = graphicsEngine.meshLinker.createMeshData(new graphicsEngine.THREE.Mesh(geometry, options?.material ?? new graphicsEngine.THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true })));
    }

    toJSON() {
        var composite = super.toJSON();
        return composite;
    }

    static fromJSON(json, world) {
        var point = new this(new Composite(json));
        return box;
    }
};

ClassRegistry.register(Point);

export default Point;