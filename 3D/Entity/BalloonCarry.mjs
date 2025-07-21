import GameObject from "../GameObject.mjs";
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

        this.mainGameObject = new GameObject({
            physics: this.sphere
        });
        this.gameObjects.push(this.mainGameObject);

        this.carryingEntity = options.carryingEntity;
        this.sphere.setRestitution(0);

        this.jointLength = options?.jointLength ?? 4
        this.joint = new DistanceConstraint({
            body1: this.sphere,
            body2: this.carryingEntity.getMainShape().physics,
            anchor1: new Vector3(0, -this.size * 2.3, 0),
            anchor2: options?.jointAnchor ?? new Vector3(0, 0, 0),
            restLength: this.jointLength
        });

        this.jointGameObject = new GameObject({
            physics: this.joint
        });
        this.gameObjects.push(this.jointGameObject);

        this.carryingEntity.getMainShape().physics.global.body.setPosition(this.sphere.global.body.position.copy().subtractInPlace(new Vector3(0, this.jointLength, 0)));


    }

    addToScene(scene) {
        for (var i of this.gameObjects) {
            if (i.mesh) {
                if(i.mesh.instancedMeshInfo){
                    scene.add(i.mesh.instancedMeshInfo.instancedMesh);
                    continue;
                }
                scene.add(i.mesh.mesh);
            }
        }
    }

    async setMesh(options, gameEngine) {
        const mesh = await gameEngine.graphicsEngine.modelPool.loadInstance("red_balloon.glb", 10, 50);
        this.mainGameObject.mesh = mesh;

        this.jointGameObject.mesh = this.joint.createMesh({ color: 0xffffff }, gameEngine);
    }

    async setMeshAndAddToScene(options, gameEngine) {
        await this.setMesh(options, gameEngine);
        this.addToScene(gameEngine.graphicsEngine.scene);
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
        if (this.carryingEntity.getMainShape().physics.id == -1 || this.joint.id == -1) {
            this.destroy();
            return;
        }
        const entityMass = this.carryingEntity.getMainShape().physics.global.body.mass;
        const ourMass = this.sphere.global.body.mass + entityMass;
        var vel = 10;
        const force = 1 / vel * (vel - Math.min(this.sphere.getTrueVelocity().magnitudeSquared(), vel)) * this.sphere.global.body.acceleration.dot(new Vector3(0, -1, 0)) * 0.45 * this.sphere.world.deltaTime * ourMass;
        this.sphere.applyForce(new Vector3(0, force, 0));

    }

    getMainShape() {
        return this.mainGameObject;
    }

}





export default BalloonCarry;