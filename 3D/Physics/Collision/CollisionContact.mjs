import Vector3 from "../Math3D/Vector3.mjs";
import Constraint from "./Constraint.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";
import Material from "./Material.mjs";



const CollisionContact = class extends Constraint {
    static name = "COLLISIONCONTACT";
    static penetrationRelaxation = 0.6;
    static impulseRelaxation = 0.4;
    static bias = 0.00004;

    constructor(options) {
        super(options);
        this.impulse = options?.impulse;

        this.normal = options?.normal;

        this.body1 = options?.body1;
        this.body2 = options?.body2;

        this.pointA = options?.pointA;
        this.pointB = options?.pointB;
        this.velocity = options?.velocity;

        this.body1_netForce = new Vector3();
        this.body2_netForce = new Vector3();
        this.body1_netTorque = new Vector3();
        this.body2_netTorque = new Vector3();

        this.material = options?.combinedMaterial;

        this.slop = options?.slop ?? 0.01;
        this.restitutionBias = 0;

        this.normalImpulse = 0;
        this.tangentialImpulse = new Vector3();
        this.bias = 0;

        this.denominator = 0;
        this.denominatorFric = 0;
        this.solved = false;
    }

    getCachedArray() {
        return [this.body1.id, this.body2.id, this.pointA.copy(), this.pointB.copy(), this.normal.copy(), this.normalImpulse];
    }

    sameContact(array) {
        const TOLERANCE = 0.00001;
        if (array[0] == this.body1.id && array[1] == this.body2.id) {
            if (Math.abs(this.normal.dot(array[4]) - 1) < TOLERANCE && this.pointA.subtract(array[2]).magnitudeSquared() < TOLERANCE && this.pointB.subtract(array[3]).magnitudeSquared() < TOLERANCE) {
                return true;
            }
        }
        return false;
    }

    isValid() {
        return this.body1.id != -1 && this.body2.id != -1;
    }

    iteratePenetration() {
        const pointA = this.pointA.add(this.body1.maxParent.translation);
        const pointB = this.pointB.add(this.body2.maxParent.translation);
        const delta = pointA.subtract(pointB);
        const penetration = delta.dot(this.normal);
        if (penetration >= 0) {
            return;
        }

        const wA = this.body1.maxParent.getEffectiveTotalInverseMass(this.normal);
        const wB = this.body2.maxParent.getEffectiveTotalInverseMass(this.normal);
        const totalInverse = wA + wB;

        const correction = this.normal.scale(Math.min(penetration + this.slop, 0) / totalInverse * this.constructor.penetrationRelaxation);
        if (wA > 0) {
            this.body1.maxParent.translation.subtractInPlace(correction.scale(wA));
        }
        if (wB > 0) {
            this.body2.maxParent.translation.addInPlace(correction.scale(wB));
        }
    }


    presolve() {
        const globalBody1 = this.body1.maxParent.global.body;
        const globalBody2 = this.body2.maxParent.global.body;
        this.velocity = this.body1.getVelocityAtPosition(this.pointA).subtractInPlace(this.body2.getVelocityAtPosition(this.pointB));
        var impactSpeed = this.velocity.dot(this.normal);
        this.restitutionBias = 0;
        if (impactSpeed < 0) {
            this.restitutionBias = -impactSpeed * this.material.restitution;
        }
        var tangential = this.velocity.projectOntoPlane(this.normal);
        var tangentialNorm = tangential.normalize();

        var radius1 = this.pointA.subtract(globalBody1.position);
        var radius2 = this.pointB.subtract(globalBody2.position);

        this.bias = this.pointA.subtract(this.pointB).dot(this.normal) * this.constructor.bias;

        var cross_n1 = radius1.cross(this.normal);
        var rotationalEffects1 = cross_n1.dot(globalBody1.inverseMomentOfInertia.multiplyVector3(cross_n1));

        var cross_n2 = radius2.cross(this.normal);
        var rotationalEffects2 = cross_n2.dot(globalBody2.inverseMomentOfInertia.multiplyVector3(cross_n2));

        rotationalEffects1 = Number.isFinite(rotationalEffects1) ? rotationalEffects1 : 0;
        rotationalEffects2 = Number.isFinite(rotationalEffects2) ? rotationalEffects2 : 0;

        var cross_t1 = radius1.cross(tangential);
        var rotationalEffects1Fric = cross_t1.dot(globalBody1.inverseMomentOfInertia.multiplyVector3(cross_t1));

        var cross_t2 = radius2.cross(tangential);
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

        this.denominator = 1 / this.denominator;
        this.denominatorFric = 1 / this.denominatorFric;

        this.solved = true;

    }

    solve() {
        if (!Number.isFinite(this.denominator)) {
            return false;
        }


        this.velocity = this.body1.getVelocityAtPosition(this.pointA).subtractInPlace(this.body2.getVelocityAtPosition(this.pointB));
        var impactSpeed = this.velocity.dot(this.normal);

        var tangential = this.velocity.projectOntoPlane(this.normal);
        var tangentialNorm = tangential.normalize();


        var impulse = -(impactSpeed - this.restitutionBias + this.bias) * this.denominator;
        impulse = Math.max(0, this.normalImpulse + impulse) - this.normalImpulse;

        
        var friction = -tangential.magnitude() * this.denominatorFric;
        var old = this.tangentialImpulse.dot(tangentialNorm);
        const maxFriction = this.normalImpulse * this.material.friction;
        const frictionImpulse = Math.max(-maxFriction, Math.min(maxFriction, friction + old)) - old;

        this.tangentialImpulse.addInPlace(tangentialNorm.scale(frictionImpulse * this.constructor.impulseRelaxation));
        
        this.impulse = this.normal.scale(impulse).addInPlace(tangentialNorm.scale(frictionImpulse)).scaleInPlace(this.constructor.impulseRelaxation);

        this.normalImpulse += impulse * this.constructor.impulseRelaxation;
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
        c.impulse = this.impulse.copy();

        c.normal = this.normal.copy();

        c.body1 = this.body1
        c.body2 = this.body2

        c.pointA = this.pointA.copy();
        c.pointB = this.pointB.copy();
        c.velocity = this.velocity.copy();

        c.body1_netForce = new Vector3();
        c.body2_netForce = new Vector3();
        c.body1_netTorque = new Vector3();
        c.body2_netTorque = new Vector3();

        c.material = this.material.copy();

        c.slop = this.slop;
        c.restitutionBias = this.restitutionBias;
        c.bias = this.bias;
        c.normalImpulse = this.normalImpulse;

        c.denominator = this.denominator
        c.denominatorFric = this.denominatorFric;
        c.solved = false;
        return c;
    }

    toJSON() {
        return {
            impulse: this.impulse.toJSON(),
            normal: this.normal.toJSON(),
            body1: this.body1.id,
            body2: this.body2.id,
            pointA: this.pointA.toJSON(),
            pointB: this.pointB.toJSON(),
            velocity: this.velocity.toJSON(),
            solved: this.solved,
            combinedMaterial: this.combinedMaterial.toJSON(),
            slop: this.slop,
            bias: this.bias,
            restitutionBias: this.restitutionBias,
            normalImpulse: this.normalImpulse,
            denominator: this.denominator,
            denominatorFric: this.denominatorFric
        }
    }

    static fromJSON(json, gameEngine) {
        var c = super.fromJSON(json, gameEngine);
        c.impulse = Vector3.fromJSON(json.impulse);
        c.normal = Vector3.fromJSON(json.normal);
        c.body1 = json.body1
        c.body2 = json.body2;
        c.pointA = Vector3.fromJSON(json.pointA);
        c.pointB = Vector3.fromJSON(json.pointB);
        c.velocity = Vector3.fromJSON(json.velocity);
        c.solved = json.solved;
        c.bias = json.bias;
        c.combinedMaterial = Material.fromJSON(json.combinedMaterial);
        c.slop = json.slop;
        c.restitutionBias = json.restitutionBias;
        c.normalImpulse = json.normalImpulse;
        c.denominator = json.denominator;
        c.denominatorFric = json.denominatorFric;
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
        this.normalImpulse = null;
        this.material = null;
    }
};
ClassRegistry.register(CollisionContact);

export default CollisionContact;