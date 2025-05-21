import Vector3 from "../Math3D/Vector3.mjs";
import Matrix3 from "../Math3D/Matrix3.mjs";
import Quaternion from "../Math3D/Quaternion.mjs";

const PhysicsBody3 = class {
    constructor(options) {
        this.mass = options?.mass ?? 1;
        this.inverseMass = options?.inverseMass ?? 1 / this.mass;

        this.momentOfInertia = options?.momentOfInertia ?? Matrix3.zero();
        this.inverseMomentOfInertia = options?.inverseMomentOfInertia ?? Matrix3.zero();

        this.position = Vector3.from(options?.position);
        this.actualPreviousPosition = Vector3.from(options?.actualPreviousPosition ?? this.position);
        this.previousPosition = Vector3.from(options?.previousPosition ?? this.position);
        this.acceleration = Vector3.from(options?.acceleration);
        this.netForce = Vector3.from(options?.netForce);

        this.rotation = Quaternion.from(options?.rotation);
        this.previousRotation = Quaternion.from(options?.previousRotation ?? this.rotation);
        this.angularVelocity = Vector3.from(options?.angularVelocity);
        this.angularAcceleration = Vector3.from(options?.angularAcceleration);
        this.netTorque = Vector3.from(options?.netTorque);

        this.angularDamping = options?.angularDamping ?? 0;
        this.linearDamping = options?.linearDamping ?? new Vector3();
        this.changed = false;
    }

    setPosition(position) {
        var velocity = this.getVelocity();
        this.position = position.copy();
        this.setVelocity(velocity);
    }

    getVelocityAtPosition(position) {
        return this.getVelocity().addInPlace(this.getAngularVelocity().cross(position.subtract(this.position)));
    }

    getVelocity() {
        return this.position.subtract(this.previousPosition);
    }

    getAngularVelocity() {
        return this.angularVelocity;
    }

    setVelocity(velocity) {
        this.previousPosition.set(this.position);
        this.previousPosition.subtractInPlace(velocity);
    }

    setMass(mass) {
        this.mass = mass;
        this.inverseMass = 1 / mass;
        if (mass == 0) {
            this.inverseMass = 0;
        }
    }

    setAngularVelocity(angularVelocity) {
        this.angularVelocity = angularVelocity.copy();
    }

    updatePosition(velocity = this.getVelocity(), world) {
        this.position.addInPlace(velocity);
        this.position.addInPlace(this.acceleration.scale(world.deltaTimeSquared * 0.5));
        this.position.addInPlace(this.netForce.scale(this.inverseMass));

        var delta = this.position.subtract(this.previousPosition).multiplyInPlace(this.linearDamping);
        this.position.subtractInPlace(delta);
    }

    updateRotation(world) {
        var deltaAngularVelocity = new Vector3();
        deltaAngularVelocity.addInPlace(this.angularAcceleration.scale(world.deltaTimeSquared * 0.5));
        if (this.netTorque.magnitudeSquared() > 0) {
            deltaAngularVelocity.addInPlace(this.inverseMomentOfInertia.multiplyVector3(this.netTorque));
        }
        this.angularVelocity.addInPlace(deltaAngularVelocity.scale(1 - this.angularDamping));
        this.angularVelocity.scaleInPlace(1 - this.angularDamping);
        this.previousRotation = this.rotation.copy();
        this.rotation = this.rotation.rotateByAngularVelocity(this.angularVelocity);
    }

    update(world) {
        var velocity = this.getVelocity();

        this.changed = !this.position.equals(this.actualPreviousPosition) || !this.rotation.equals(this.previousRotation);
        
        this.actualPreviousPosition = this.position.copy();
        this.previousPosition = this.position.copy();


        this.updatePosition(velocity, world);
        this.netForce.reset();

        this.updateRotation(world);
        this.netTorque.reset();
    }


    toJSON() {
        var body = {};

        body.mass = this.mass;
        body.inverseMass = this.inverseMass;
        body.momentOfInertia = this.momentOfInertia.toJSON();
        body.inverseMomentOfInertia = this.inverseMomentOfInertia.toJSON();

        body.position = this.position.toJSON();
        body.actualPreviousPosition = this.actualPreviousPosition.toJSON();
        body.previousPosition = this.previousPosition.toJSON();
        body.acceleration = this.acceleration.toJSON();
        body.netForce = this.netForce.toJSON();
        body.rotation = this.rotation.toJSON();
        body.previousRotation = this.previousRotation.toJSON();
        body.angularVelocity = this.angularVelocity.toJSON();
        body.angularAcceleration = this.angularAcceleration.toJSON();
        body.netTorque = this.netTorque.toJSON();
        body.angularDamping = this.angularDamping;
        body.linearDamping = this.linearDamping.toJSON();
        body.changed = this.changed;
        return body;
    }

    static fromJSON(json, world) {
        var body = new this();
        body.mass = json.mass;
        body.inverseMass = json.inverseMass;
        body.momentOfInertia = Matrix3.fromJSON(json.momentOfInertia);
        body.inverseMomentOfInertia = Matrix3.fromJSON(json.inverseMomentOfInertia);
        body.position = Vector3.fromJSON(json.position);
        body.actualPreviousPosition = Vector3.fromJSON(json.actualPreviousPosition);
        body.previousPosition = Vector3.fromJSON(json.previousPosition);
        body.acceleration = Vector3.fromJSON(json.acceleration);
        body.netForce = Vector3.fromJSON(json.netForce);
        body.rotation = Quaternion.fromJSON(json.rotation);
        body.previousRotation = Quaternion.fromJSON(json.previousRotation);
        body.angularVelocity = Vector3.fromJSON(json.angularVelocity);
        body.angularAcceleration = Vector3.fromJSON(json.angularAcceleration);
        body.netTorque = Vector3.fromJSON(json.netTorque);
        body.angularDamping = json.angularDamping;
        body.linearDamping = Vector3.fromJSON(json.linearDamping);
        body.changed = json.changed;
        return body;
    }
};


export default PhysicsBody3;