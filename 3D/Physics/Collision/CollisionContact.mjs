import Vector3 from "../Math3D/Vector3.mjs";
import Constraint from "./Constraint.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";
import Material from "./Material.mjs";

const CollisionContact = class extends Constraint {
    static name = "COLLISIONCONTACT";
    constructor(options) {
        super(options);
        this.impulse = options?.impulse;

        this.normal = options?.normal;

        this.body1 = options?.body1;
        this.body2 = options?.body2;

        this.pointA = options?.pointA;
        this.pointB = options?.pointB;
        this.velocity = options?.velocity;

        this.body1Map = options?.body1Map;
        this.body2Map = options?.body2Map;

        this.body1_netForce = new Vector3();
        this.body2_netForce = new Vector3();
        this.body1_netTorque = new Vector3();
        this.body2_netTorque = new Vector3();

        this.material = options?.combinedMaterial;

        this.slop = 0.01;
        this.bias = 0.2;

        this.denominator = 0;
        this.denominatorFric = 0;
        this.solved = false;
    }

    isValid() {
        return this.body1.id != -1 && this.body2.id != -1;
    }

    iteratePenetration() {
        const pointA = this.pointA.add(this.body1Map.translation);
        const pointB = this.pointB.add(this.body2Map.translation);
        const delta = pointA.subtract(pointB);
        const penetration = delta.dot(this.normal);
        if (penetration >= 0) {
            return;
        }

        const wA = this.body1.maxParent.getEffectiveTotalInverseMass(this.normal);
        const wB = this.body2.maxParent.getEffectiveTotalInverseMass(this.normal);
        const totalInverse = wA + wB;

        const correction = this.normal.scale(Math.min(penetration + this.slop, 0) / totalInverse * this.bias);
        if (wA > 0) {
            this.body1Map.translation.subtractInPlace(correction);
        }
        if (wB > 0) {
            this.body2Map.translation.addInPlace(correction);
        }
    }

    solve() {
        const globalBody1 = this.body1.maxParent.global.body;
        const globalBody2 = this.body2.maxParent.global.body;

        this.velocity = this.body1.getVelocityAtPosition(this.pointA).subtractInPlace(this.body2.getVelocityAtPosition(this.pointB));
        var impactSpeed = this.velocity.dot(this.normal);
        if (impactSpeed > 0) {
            this.impulse = new Vector3(0, 0, 0);
            return false;
        }
        var tangential = this.velocity.projectOntoPlane(this.normal);
        var tangentialNorm = tangential.normalize();
        if (!this.solved) {
            var radius1 = this.pointA.subtract(globalBody1.position);
            var radius2 = this.pointB.subtract(globalBody2.position);

            var cross_n1 = radius1.cross(this.normal);
            var rotationalEffects1 = cross_n1.dot(globalBody1.inverseMomentOfInertia.multiplyVector3(cross_n1));

            var cross_n2 = radius2.cross(this.normal);
            var rotationalEffects2 = cross_n2.dot(globalBody2.inverseMomentOfInertia.multiplyVector3(cross_n2));

            rotationalEffects1 = Number.isFinite(rotationalEffects1) ? rotationalEffects1 : 0;
            rotationalEffects2 = Number.isFinite(rotationalEffects2) ? rotationalEffects2 : 0;


            var cross_t1 = radius1.cross(tangentialNorm);
            var rotationalEffects1Fric = cross_t1.dot(globalBody1.inverseMomentOfInertia.multiplyVector3(cross_t1));

            var cross_t2 = radius2.cross(tangentialNorm);
            var rotationalEffects2Fric = cross_t2.dot(globalBody2.inverseMomentOfInertia.multiplyVector3(cross_t2));
            rotationalEffects1Fric = Number.isFinite(rotationalEffects1Fric) ? rotationalEffects1Fric : 0;
            rotationalEffects2Fric = Number.isFinite(rotationalEffects2Fric) ? rotationalEffects2Fric : 0;

            var invMass1 = this.body1.maxParent.global.body.inverseMass;
            var invMass2 = this.body2.maxParent.global.body.inverseMass;

            if (this.body1.maxParent.isImmovable()) {
                invMass1 = 0;
                rotationalEffects1 = 0;
                rotationalEffects1Fric = 0;
            }
            if (this.body2.maxParent.isImmovable()) {
                invMass2 = 0;
                rotationalEffects2 = 0;
                rotationalEffects2Fric = 0;
            }
            this.denominator = invMass1 * (1 - globalBody1.linearDamping.multiply(this.normal).magnitude()) + rotationalEffects1 * (1 - globalBody1.angularDamping);

            this.denominator += invMass2 * (1 - globalBody2.linearDamping.multiply(this.normal).magnitude()) + rotationalEffects2 * (1 - globalBody2.angularDamping);

            this.denominatorFric = invMass1 * (1 - globalBody1.linearDamping.multiply(tangentialNorm).magnitude()) + rotationalEffects1Fric * (1 - globalBody1.angularDamping);

            this.denominatorFric += invMass2 * (1 - globalBody2.linearDamping.multiply(tangentialNorm).magnitude()) + rotationalEffects2Fric * (1 - globalBody2.angularDamping);
            if (this.denominator == 0) {
                return false;
            }
        }
        var impulse = - (1 + this.material.restitution) * impactSpeed / this.denominator;

        if (impulse < 0) {
            impulse = 0;
        }

        var maxFriction = tangential.magnitude() / this.denominatorFric;
        var friction = impulse * this.material.friction;
        this.impulse = tangentialNorm.scale(-1 * Math.max(0, Math.min(maxFriction, friction))).addInPlace(this.normal.scale(impulse));
        this.solved = true;
        return true;
    }

    applyForces() {
        var f1 = this.body1.maxParent.getForceEffect(this.impulse, this.pointA);
        var f2 = this.body2.maxParent.getForceEffect(this.impulse.scale(-1), this.pointB);
        if (f1) {
            this.body1_netForce = f1[0];
            this.body1_netTorque = f1[1];
        }
        else {
            this.body1_netForce.reset();
            this.body1_netTorque.reset();
        }
        if (f2) {
            this.body2_netForce = f2[0]
            this.body2_netTorque = f2[1];
        }
        else {
            this.body2_netForce.reset();
            this.body2_netTorque.reset();
        }
    }

    copy() {
        var c = new this.constructor();
        c.normal = this.normal.copy();

        c.body1 = this.body1;
        c.body2 = this.body2;
        c.pointA = this.pointA;
        c.pointB = this.pointB;
        c.velocity = this.velocity;

        c.solved = this.solved;
        c.impulse = this.impulse;

        c.combinedMaterial = this.combinedMaterial;
        return c;
    }

    toJSON() {
        return {
            normal: this.normal.toJSON(),
            body1: this.body1.id,
            body2: this.body2.id,
            pointA: this.pointA.toJSON(),
            pointB: this.pointB.toJSON(),
            velocity: this.velocity.toJSON(),
            solved: this.solved,
            impulse: this.impulse.toJSON(),
            combinedMaterial: this.combinedMaterial.toJSON(),
            slop: this.slop,
            bias: this.bias
        }
    }

    static fromJSON(json, gameEngine) {
        var c = super.fromJSON(json, gameEngine);
        c.normal = new Vector3().fromJSON(json.normal);

        c.body1 = json.body1
        c.body2 = json.body2
        c.pointA = Vector3.fromJSON(json.pointA);
        c.pointB = Vector3.fromJSON(json.pointB);
        c.velocity = Vector3.fromJSON(json.velocity);

        c.solved = json.solved;
        c.impulse = Vector3.fromJSON(json.impulse);

        c.slop = json.slop;
        c.bias = json.bias;

        c.combinedMaterial = Material.fromJSON(json.combinedMaterial);
        return c;
    }

    updateReferences(gameEngine) {
        super.updateReferences(gameEngine);
        this.body1 = gameEngine.world.getByID(this.body1);
        this.body2 = gameEngine.world.getByID(this.body2);
    }

    destroy() {
        super.destroy();
        this.body1 = null;
        this.body2 = null;
        this.material = null;
    }
};
ClassRegistry.register(CollisionContact);

export default CollisionContact;