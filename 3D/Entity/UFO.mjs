import Vector3 from '../Physics/Math3D/Vector3.mjs';
import Box from '../Physics/Shapes/Box.mjs';
import Composite from '../Physics/Shapes/Composite.mjs';
import Entity from './Entity.mjs';
import Slime from './Slime.mjs';

class UFO extends Entity {
    constructor(options) {
        super(options);

        this.composite = new Composite({
            local: {
                body: {
                    mass: 1
                }
            }
        });
        this.beamSensor = new Box({
            width: 2,
            height: 30,
            depth: 2,
            isSensor: true,
            local: {
                body: {
                    mass: 0.0000001,
                    position: new Vector3(0, -15, 0)
                }
            }
        })
        this.composite.add(this.beamSensor);
        this.damage = options?.damage ?? 20;
        this.player = options?.player ?? null;
        this.targetPosition = null;
        this.targetRadius = 24;
        this.velocity = options?.velocity ?? 0.2;
        this.pushVelocity = options?.pushVelocity ?? 0.1;

        this.beamCollision = function (contact) {
            var other = null;
            var side = 1;
            if (contact.body1 == this.beamSensor) {
                other = contact.body2.maxParent;
                side = -1;
            }
            else {
                other = contact.body1.maxParent;
            }
            const otherEntity = this.gameEngine.entitySystem.getEntityFromShape(other);
            if (otherEntity instanceof Slime) {
                var alreadyDead = otherEntity.health <= 0;
                otherEntity.takeDamage(this.damage);
                if (otherEntity.health <= 0 && !alreadyDead) {
                    this.cash += 150;
                }
                var scale = 1;
                const correctNormal = contact.normal.scale(side);
                otherEntity.getMainShape().setTrueVelocity(otherEntity.getMainShape().getTrueVelocity().add(new Vector3(0, this.pushVelocity, 0)));
            }
        }.bind(this);

        this.beamSensor.addEventListener("collision", this.beamCollision);

        this.updateShapeID(this.composite);
    }

    addToWorld(world) {
        world.addComposite(this.composite);
        this.updateShapeID();
    }

    async setMesh(options, gameEngine) {
        const gltf = await gameEngine.graphicsEngine.load("UFO.glb");
        gameEngine.graphicsEngine.makeShadows(gltf.scene);
        var meshData = gameEngine.graphicsEngine.meshLinker.createMeshData(gltf.scene);
        this.composite.mesh = meshData;
        this.beamSensor.setMesh({
            color: 0xff0000
        }, gameEngine);
        const m = this.beamSensor.mesh.mesh;
        m.material.transparent = true;
        m.material.opacity = 0.3;
        m.castShadow = true;
        m.receiveShadow = true;
        top.b = this.beamSensor;
    }

    addToScene(gameEngine) {
        this.composite.addToScene(gameEngine);
        this.beamSensor.addToScene(gameEngine);
    }

    async setMeshAndAddToScene(options, gameEngine) {
        await this.setMesh(options, gameEngine);
        this.addToScene(gameEngine);
    }

    recomputeTarget() {
        const playerPos = this.player.getMainShape().global.body.position;
        this.targetPosition = playerPos.add(new Vector3(0, 10, 0));
        this.targetPosition.x += Math.random() * this.targetRadius - this.targetRadius / 2;
        this.targetPosition.z += Math.random() * this.targetRadius - this.targetRadius / 2;
        return this.targetPosition;
    }

    updateStep() {
        this.targetPosition = this.targetPosition ? this.targetPosition : this.recomputeTarget();
        const direction = this.targetPosition.subtract(this.composite.global.body.position);
        const distanceToPlayer = this.composite.global.body.position.subtract(this.player.getMainShape().global.body.position).magnitude();
        const directionNorm = direction.normalize();
        const move = directionNorm.scale(this.velocity * (distanceToPlayer * 0.25 + 1));
        if (move.magnitudeSquared() > direction.magnitudeSquared() || direction.magnitudeSquared() < 0.0001) {
            this.recomputeTarget();
            return;
        }
        this.composite.setTrueVelocity(move);
    }
}

export default UFO;