import DistanceConstraint from "../Physics/Collision/DistanceConstraint.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";
import Sphere from "../Physics/Shapes/Sphere.mjs";
import Entity from "./Entity.mjs";

class BalloonCarry extends Entity {
    constructor(options) {
        super(options);
        this.usesInstancing = true;
        this.gravity = options?.gravity ?? new Vector3(0, 0, 0);
        this.size = options?.size ?? 2
        this.sphere = new Sphere({
            radius: this.size,
            local: {
                body: {
                    mass: options?.mass ?? 1
                }
            },
            global: {
                body: {
                    position: options?.position,
                    acceleration: this.gravity
                }
            }
        });

        this.carryingEntity = options.carryingEntity;


        this.jointLength = options?.jointLength ?? 4
        this.joint = new DistanceConstraint({
            body1: this.sphere,
            body2: this.carryingEntity.getMainShape(),
            anchor1: new Vector3(0, -this.size * 2.3, 0),
            anchor2: options?.jointAnchor ?? new Vector3(0, 0, 0),
            restLength: this.jointLength
        });
        this.carryingEntity.getMainShape().global.body.setPosition(this.sphere.global.body.position.copy().subtractInPlace(new Vector3(0, this.jointLength, 0)));


    }

    addToScene(gameEngine) {
        gameEngine.graphicsEngine.scene.add(this.sphere.mesh.instancedMeshInfo.instancedMesh);
        this.joint.addToScene(gameEngine);
    }

    async setMesh(options, gameEngine) {
        const mesh = await gameEngine.graphicsEngine.modelPool.loadInstance("red_balloon.glb", 10, 50);
        this.sphere.mesh = mesh;

        this.joint.setMesh({ color: 0xffffff }, gameEngine)
    }

    async setMeshAndAddToScene(options, gameEngine) {
        await this.setMesh(options, gameEngine);
        this.addToScene(gameEngine);
    }

    addToWorld(world) {
        world.addComposite(this.sphere);
        world.addConstraint(this.joint);
        this.updateShapeID(this.sphere);
    }

    update() {
        if (this.sphere.mesh) {
            const mesh = this.sphere.mesh;
            const info = mesh.instancedMeshInfo;

            if (Number.isFinite(mesh.instancedIndex)) {
                const dummy = info.dummy;
                info.instancedMesh.getMatrixAt(mesh.instancedIndex, dummy.matrix);
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);



                dummy.scale.set(this.sphere.radius, this.sphere.radius, this.sphere.radius);


                dummy.updateMatrix();
                info.instancedMesh.setMatrixAt(mesh.instancedIndex, dummy.matrix);
            }
        }

        const entityMass = this.carryingEntity.getMainShape().global.body.mass;
        const ourMass = this.sphere.global.body.mass + entityMass;
        const force = 1/0.4*(0.4-Math.min(this.sphere.global.body.getVelocity().magnitudeSquared(), 0.4))*this.sphere.global.body.acceleration.dot(new Vector3(0, -1, 0)) * 0.3 * this.sphere.world.deltaTimeSquared * ourMass;        
        this.sphere.applyForce(new Vector3(0, force, 0));
    }

    destroy() {
        this.entitySystem.remove(this);
        this.joint.disposeMesh();
        this.sphere.world.removeComposite(this.sphere);
        this.joint.world.removeConstraint(this.joint);
        this.sphere.destroy();
        this.joint.destroy();
        this.carryingEntity = null;
    }

    updateStep() {
        if (this.carryingEntity.getMainShape().id == -1 || this.joint.id == -1) {
            this.destroy();
            return;
        }


    }

    getMainShape() {
        return this.sphere;
    }

}


export default BalloonCarry;