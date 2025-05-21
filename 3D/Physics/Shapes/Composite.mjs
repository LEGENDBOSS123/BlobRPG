import Material from "../Collision/Material.mjs";
import PhysicsBody3 from "../Core/PhysicsBody3.mjs";
import Hitbox3 from "../Broadphase/Hitbox3.mjs";
import Vector3 from "../Math3D/Vector3.mjs";
import Matrix3 from "../Math3D/Matrix3.mjs";
import WorldObject from "../Core/WorldObject.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";
const Composite = class extends WorldObject {

    static FLAGS = {
        STATIC: 1 << 0,
        DYNAMIC: 1 << 1,
        KINEMATIC: 1 << 2,
        CENTER_OF_MASS: 1 << 3,
        FIXED_POSITION: 1 << 4,
        FIXED_ROTATION: 1 << 5,
        OCCUPIES_SPACE: 1 << 6
    };

    static name = "COMPOSITE";

    constructor(options) {
        super(options);

        this.parent = options?.parent ?? null;
        this.maxParent = options?.maxParents ?? this;
        this.children = options?.children ?? [];
        this.material = options?.material ?? new Material();
        this.collisionMask = options?.collisionMask ?? 0b00000000000000000000000001;
        this.canCollideWithMask = options?.canCollideWithMask ?? 0b11111111111111111111111111;

        this.global = {};
        this.global.body = new PhysicsBody3(options?.global?.body);
        this.global.hitbox = Hitbox3.from(options?.global?.hitbox);
        this.global.expandedHitbox = Hitbox3.from(options?.global?.expandedHitbox);
        this.global.flags = options?.global?.flags ?? 0;

        this.local = {};
        this.local.body = new PhysicsBody3(options?.local?.body);
        this.local.flags = options?.local?.flags ?? 0;
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, false);
        this.isSensor = options?.isSensor ?? false;
        this.local.hitbox = Hitbox3.from(options?.local?.hitbox);
        this.sleeping = options?.sleeping ?? false;
        this.sleepThreshold = options?.sleepThreshold ?? 16;
        this.sleepCounter = options?.sleepCounter ?? 0;
        this.isSleepy = options?.isSleepy ?? false;
        this.contacts = [];
    }


    setBitMask(mask, letter, value) {
        const position = letter.charCodeAt(0) - "A".charCodeAt(0);
        if (value) {
            return mask |= 1 << position;
        }
        return mask &= ~(1 << position);
    }

    getEffectiveTotalMass(normal = new Vector3(0, 1, 0)) {
        if (this.isImmovable()) {
            return Infinity;
        }
        return this.global.body.mass * 1 / (1 - this.global.body.linearDamping.multiply(normal).magnitude());
    }

    toggleBitMask(mask, letter) {
        const position = letter.charCodeAt(0) - "A".charCodeAt(0);
        return mask ^= 1 << position;
    }

    addEventListener(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (!this.events[event]) {
            return;
        }
        const index = this.events[event].indexOf(callback);
        if (index == -1) {
            return;
        }
        this.events[event].splice(index, 1);
    }

    setRestitution(restitution) {
        this.material.setRestitution(restitution);
        return this;
    }

    setFriction(friction) {
        this.material.setFriction(friction);
        return this;
    }

    translateWorldToLocal(v) {
        return this.global.body.rotation.conjugate().multiplyVector3(v.subtract(this.global.body.position));
    }

    translateLocalToWorld(v) {
        return this.global.body.rotation.multiplyVector3(v)
            .addInPlace(this.global.body.position);
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        return this.local.body.momentOfInertia;
    }

    rotateLocalMomentOfInertia(quaternion) {
        const rotationMatrix = quaternion.toMatrix3();
        const result = rotationMatrix.multiply(this.local.body.momentOfInertia).multiply(rotationMatrix.transpose());
        return result;
    }

    calculateGlobalMomentOfInertia() {
        this.global.body.momentOfInertia.setMatrix3(this.rotateLocalMomentOfInertia(this.global.body.rotation));
        const mass = this.local.body.mass;
        const dx = this.maxParent.global.body.position.x - this.global.body.position.x;
        const dy = this.maxParent.global.body.position.y - this.global.body.position.y;
        const dz = this.maxParent.global.body.position.z - this.global.body.position.z;
        const Ixx = mass * (dy * dy + dz * dz);
        const Iyy = mass * (dx * dx + dz * dz);
        const Izz = mass * (dx * dx + dy * dy);
        const Ixy = - mass * dx * dy;
        const Ixz = - mass * dx * dz;
        const Iyz = - mass * dy * dz;
        this.global.body.momentOfInertia.elements[0] += Ixx;
        this.global.body.momentOfInertia.elements[1] += Ixy;
        this.global.body.momentOfInertia.elements[2] += Ixz;
        this.global.body.momentOfInertia.elements[3] += Ixy;
        this.global.body.momentOfInertia.elements[4] += Iyy;
        this.global.body.momentOfInertia.elements[5] += Iyz;
        this.global.body.momentOfInertia.elements[6] += Ixz;
        this.global.body.momentOfInertia.elements[7] += Iyz;
        this.global.body.momentOfInertia.elements[8] += Izz;
        return this.global.body.momentOfInertia;
    }

    dimensionsChanged() {
        this.awaken();
        this.calculateLocalHitbox();
        this.calculateGlobalHitbox(true);
        this.calculateLocalMomentOfInertia();
    }

    calculateLocalHitbox() {
        this.local.hitbox.min = new Vector3(0, 0, 0);
        this.local.hitbox.max = new Vector3(0, 0, 0);
        return this.local.hitbox;
    }

    calculateGlobalHitbox() {
        this.global.hitbox.min = this.local.hitbox.min.add(this.global.body.position);
        this.global.hitbox.max = this.local.hitbox.max.add(this.global.body.position);
        return this.global.hitbox;
    }

    getGlobalFlag(flag) {
        return (this.global.flags & flag) != 0;
    }

    setGlobalFlag(flag, value) {
        if (value) {
            this.global.flags |= flag;
        } else {
            this.global.flags &= ~flag;
        }
    }

    toggleGlobalFlag(flag) {
        this.flags ^= flag;
    }

    setLocalFlag(flag, value) {
        if (value) {
            this.local.flags |= flag;
        } else {
            this.local.flags &= ~flag;
        }
    }

    toggleLocalFlag(flag) {
        this.local.flags ^= flag;
    }

    getLocalFlag(flag) {
        return (this.local.flags & flag) != 0;
    }

    isImmovable() {
        return this.getLocalFlag(this.constructor.FLAGS.STATIC | this.constructor.FLAGS.KINEMATIC);
    }

    canCollideWith(other) {
        if (other.maxParent == this.maxParent) {
            return false;
        }
        if ((this.collisionMask & other.canCollideWithMask) == 0 || (this.canCollideWithMask & other.collisionMask) == 0) {
            return false;
        }
        if (this.maxParent.isImmovable() && other.maxParent.isImmovable()) {
            return false;
        }
        return true;
    }

    translate(v) {
        if (this.maxParent.isImmovable()) {
            return;
        }
        if (this.isMaxParent()) {
            const velocity = this.global.body.getVelocity()
            this.global.body.position.addInPlace(v.multiply(new Vector3(1, 1, 1).subtract(this.global.body.linearDamping)));
            this.global.body.setVelocity(velocity);
            this.translateChildrenGlobal(v);
            return;
        }
        this.maxParent.translate(v);
    }

    setParentAll(parent) {
        this.parent = parent;
        for (const child of this.children) {
            child.setParentAll(parent);
        }
    }

    add(child) {
        child.setParentAll(this);
        child.setMaxParentAll(this);
        this.children.push(child);
        child.syncAll();
    }

    isMaxParent() {
        return this == this.maxParent;
    }

    setMaxParentAll(maxParent) {
        this.maxParent = maxParent;
        for (const child of this.children) {
            child.setMaxParentAll(maxParent);
        }
    }
    removeSelf() {
        if (this.isMaxParent()) {
            return;
        }
        this.maxParent = this;
        this.setMaxParentAll(this);
    }

    getVelocityAtPosition(position) {
        return this.global.body.getVelocityAtPosition(position);
    }

    getForceEffect(force, position = this.global.body.position) {
        if (force.magnitudeSquared() == 0) {
            return null;
        }
        if (this.isMaxParent()) {
            if (this.getGlobalFlag(this.constructor.FLAGS.KINEMATIC | this.constructor.FLAGS.STATIC)) {
                return null;
            }
            return [force, (position.subtract(this.global.body.position)).cross(force)];
        }
        return this.maxParent.getForceEffects(force, position);
    }

    applyForce(force, position = this.global.body.position) {
        if (force.magnitudeSquared() == 0) {
            return;
        }
        if (this.isMaxParent()) {
            this.awaken();
            if (this.getGlobalFlag(this.constructor.FLAGS.KINEMATIC | this.constructor.FLAGS.STATIC)) {
                return;
            }
            this.global.body.netForce.addInPlace(force);
            this.global.body.netTorque.addInPlace((position.subtract(this.global.body.position)).cross(force));
            return;
        }
        this.maxParent.applyForce(force, position);
    }

    setPosition(position) {
        if (this.isMaxParent()) {
            this.global.body.setPosition(position);
            return;
        }
        this.local.body.setPosition(position);
    }

    setRotation(rotation) {
        if (this.isMaxParent()) {
            this.global.body.rotation = rotation.copy();
            return;
        }
        this.local.body.rotation = rotation.copy();
    }

    setAngularVelocity(angularVelocity) {
        if (this.isMaxParent()) {
            this.global.body.angularVelocity = angularVelocity.copy();
            return;
        }
        this.local.body.angularVelocity = angularVelocity.copy();
    }

    getCenterOfMass(skip = false) {
        if (!this.children.length) {
            return this.global.body.position.copy();
        }
        const centerOfMass = skip ? new Vector3() : this.global.body.position.scale(this.local.body.mass);
        for (const child of this.children) {
            centerOfMass.addInPlace(child.getCenterOfMass().scale(child.global.body.mass));
        }
        centerOfMass.scaleInPlace(1 / (this.global.body.mass - (skip ? this.local.body.mass : 0)));
        return centerOfMass;
    }


    syncAll() {

        if (!this.isMaxParent()) {

            this.global.flags = this.parent.global.flags | this.local.flags;

            this.global.body.rotation.set(this.parent.global.body.rotation.multiply(this.local.body.rotation));

            this.global.body.position.set(this.parent.global.body.position.add(this.parent.global.body.rotation.multiplyVector3(this.local.body.position)));
            this.global.body.setVelocity(this.parent.global.body.getVelocity().addInPlace(this.parent.global.body.getAngularVelocity().cross(this.global.body.position.subtract(this.parent.global.body.position))));

            this.global.body.acceleration.set(this.parent.global.body.acceleration.add(this.parent.global.body.rotation.multiplyVector3(this.local.body.acceleration)));

            this.global.body.angularVelocity.set(this.parent.global.body.angularVelocity.add(this.local.body.angularVelocity));
            this.global.body.angularAcceleration.set(this.parent.global.body.angularAcceleration.add(this.local.body.angularAcceleration));
        }
        else {
            this.global.flags = this.local.flags;
        }
        this.global.body.mass = this.local.body.mass;
        for (const child of this.children) {
            child.syncAll();
        }
        if(this.parent){
            this.parent.global.body.mass += this.global.body.mass;
        }
        this.global.body.setMass(this.global.body.mass)

        if (this.getLocalFlag(this.constructor.FLAGS.CENTER_OF_MASS)) {
            const centerOfMass = this.getCenterOfMass(true);
            const translationAmount = this.global.body.rotation.conjugate().multiplyVector3(this.global.body.position.subtract(centerOfMass));
            this.translateChildren(translationAmount);
        }
    }

    updateGlobalHitboxAll() {
        this.calculateGlobalHitbox();
        const projectedHitbox = this.global.hitbox.translate(this.global.body.getVelocity().scale(-1));
        this.global.expandedHitbox = Hitbox3.fromHitboxes([projectedHitbox, this.global.hitbox]);
        if (this.gameEngine.world?.spatialHash && this.getLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE)) {
            this.gameEngine.world.spatialHash.addHitbox(this.global.expandedHitbox, this.id);
        }
        for (const child of this.children) {
            child.updateGlobalHitboxAll();
        }
    }

    updateGlobalMomentOfInertiaAll() {
        this.calculateGlobalMomentOfInertia();
        for (const child of this.children) {
            child.updateGlobalMomentOfInertiaAll();
        }
        this.global.body.inverseMomentOfInertia = this.global.body.momentOfInertia.invert();
    }

    updateMaxParentMomentOfInertia() {
        if (this.isMaxParent()) {
            this.updateGlobalMomentOfInertiaAll();
        }
        else {
            this.maxParent.global.body.momentOfInertia.addInPlace(this.global.body.momentOfInertia);
        }
        for (const child of this.children) {
            child.updateMaxParentMomentOfInertia();
        }
        if (this.isMaxParent()) {
            this.maxParent.global.body.inverseMomentOfInertia = this.maxParent.global.body.momentOfInertia.invert();
        }
    }

    update() {
        if (!this.isMaxParent()) {
            this.local.body.update(this.gameEngine.world);
            this.global.body.actualPreviousPosition.set(this.global.body.position);
            this.global.body.previousRotation.set(this.global.body.rotation);
            return;
        }
        this.global.body.update(this.gameEngine.world);
    }

    updateBeforeCollisionAll() {

        for (const child of this.children) {
            child.updateBeforeCollisionAll();
        }

        this.update();

        if (this.isMaxParent()) {
            this.syncAll();
            this.updateGlobalHitboxAll();
            this.updateMaxParentMomentOfInertia();
        }
    }

    updateIsSleepy() {
        this.isSleepy = this.global.body.getVelocity().magnitudeSquared() < this.gameEngine.world.linearSleepThreshold && this.global.body.actualPreviousPosition.distanceSquared(this.global.body.position) < this.gameEngine.world.linearSleepThreshold && this.global.body.previousRotation.dot(this.global.body.rotation) > this.gameEngine.world.angularSleepThreshold;
    }

    updateSleepAll() {
        this.updateIsSleepy();
        for (const c of this.contacts) {
            const c2 = this.gameEngine.world.getByID(c);
            if (c2 && !c2.isSleepy) {
                this.awaken();
                break;
            }
        }
        var cannotSleep = false;
        for (const child of this.children) {
            child.updateSleepAll();
            if (!child.sleeping) {
                cannotSleep = true;
            }
        }
        if (cannotSleep) {
            this.awaken();
            return;
        }

        if (this.isSleepy) {
            return this.getSleepy();
        }
        return this.awaken();
    }

    updateAfterCollisionAll() {
        if (this.isMaxParent()) {
            this.syncAll();
        }
    }

    awaken() {
        this.sleeping = false;
        this.sleepCounter = 0;
        this.contacts = [];
    }

    getSleepy() {
        this.sleepCounter++;
        if (this.sleepCounter >= this.sleepThreshold) {
            this.sleep();
        }
    }

    sleep() {
        this.sleeping = true;
        this.sleepCounter = this.sleepThreshold;
    }

    translateChildren(v) {
        for (const child of this.children) {
            child.local.body.position.addInPlace(v);
            child.local.body.previousPosition.addInPlace(v);
        }
    }

    translateChildrenGlobal(v) {
        for (const child of this.children) {
            child.global.body.position.addInPlace(v);
            child.global.body.previousPosition.addInPlace(v);
        }
    }

    lerpMesh(last, lerp, previousWorld) {
        if (!this.mesh) {
            return;
        }
        this.mesh.mesh.position.set(...this.global.body.position.lerp(last.global.body.position, 1 - lerp));
        const quat = this.global.body.rotation.slerp(last.global.body.rotation, 1 - lerp);
        this.mesh.mesh.quaternion.set(...[quat.x, quat.y, quat.z, quat.w]);
    }

    toJSON() {
        const composite = super.toJSON();
        composite.id = this.id;
        composite.world = this.gameEngine?.world?.id ?? null;
        composite.parent = this.parent?.id ?? null;
        composite.maxParent = this.maxParent.id;
        composite.children = [];
        for (const child of this.children) {
            composite.children.push(child.id);
        }
        composite.toBeRemoved = this.toBeRemoved;
        composite.material = this.material.toJSON();
        composite.global = {};
        composite.global.body = this.global.body.toJSON();
        composite.global.hitbox = this.global.hitbox.toJSON();
        composite.global.expandedHitbox = this.global.expandedHitbox.toJSON();
        composite.global.flags = this.global.flags;
        composite.local = {};
        composite.local.body = this.local.body.toJSON();
        composite.local.hitbox = this.local.hitbox.toJSON();
        composite.local.flags = this.local.flags;
        composite.sleeping = this.sleeping;
        composite.sleepThreshold = this.sleepThreshold;
        composite.sleepCounter = this.sleepCounter;
        return composite;
    }

    static fromJSON(json, gameEngine) {
        const composite = super.fromJSON(json, gameEngine);
        composite.world = world;
        composite.id = json.id;
        composite.parent = json.parent;
        composite.maxParent = json.maxParent;
        composite.children = [];
        for (const child of json.children) {
            composite.children.push(child);
        }
        composite.toBeRemoved = json.toBeRemoved;
        composite.material = Material.fromJSON(json.material, world);
        composite.global.body = PhysicsBody3.fromJSON(json.global.body, world);
        composite.global.hitbox = Hitbox3.fromJSON(json.global.hitbox);
        composite.global.expandedHitbox = Hitbox3.fromJSON(json.global.expandedHitbox);
        composite.global.flags = json.global.flags;
        composite.local.body = PhysicsBody3.fromJSON(json.local.body, world);
        composite.local.hitbox = Hitbox3.fromJSON(json.local.hitbox, world);
        composite.local.flags = json.local.flags;
        composite.gameEngine = gameEngine;
        composite.sleeping = json.sleeping;
        composite.sleepThreshold = json.sleepThreshold;
        composite.sleepCounter = json.sleepCounter;
        return composite;
    }

    updateReferences(gameEngine = this.gameEngine) {
        this.parent = this.parent == null ? null : world.getByID(this.parent);
        this.maxParent = gameEngine.world.getByID(this.maxParent);
        for (var i = 0; i < this.children.length; i++) {
            this.children[i] = world.getByID(this.children[i]);
        }
        if (gameEngine) {
            this.gameEngine = gameEngine;
        }
    }
}

ClassRegistry.register(Composite);

export default Composite;