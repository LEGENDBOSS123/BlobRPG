import Vector3 from "../Math3D/Vector3.mjs";
import Constraint from "./Constraint.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";
import Quaternion from "../Math3D/Quaternion.mjs";
const DistanceConstraint = class extends Constraint {
    static name = "DISTANCECONSTRAINT";
    constructor(options) {

        super(options);

        this.impulse = options?.impulse ?? new Vector3();

        this.body1 = options?.body1 ?? null;
        this.body2 = options?.body2 ?? null;

        this.body1_netForce = new Vector3();
        this.body2_netForce = new Vector3();
        this.body1_netTorque = new Vector3();
        this.body2_netTorque = new Vector3();

        this.point1 = options?.point1 ?? new Vector3();
        this.point2 = options?.point2 ?? new Vector3();

        this.anchor1 = options?.anchor1 ?? new Vector3();
        this.anchor2 = options?.anchor2 ?? new Vector3();

        this.lowerBound = options?.lowerBound ?? options?.restLength ?? 0;
        this.upperBound = options?.upperBound ?? options?.restLength ?? Infinity;

        this.penetration = options?.penetration ?? new Vector3();
        this.denominator = options?.denominator ?? 0;
        this.solved = false;

    }

    getPoints() {
        if (!this.body1 || !this.body2) {
            return null;
        }
        var point1 = this.body1.global.body.position.add(this.body1.global.body.rotation.multiplyVector3(this.anchor1));
        var point2 = this.body2.global.body.position.add(this.body2.global.body.rotation.multiplyVector3(this.anchor2));
        return [point1, point2];
    }

    lerpMesh(last, lerp, previousWorld) {
        var lastbody1 = previousWorld.all[last?.body1];
        var lastbody2 = previousWorld.all[last?.body2];

        if (!lastbody1 || !lastbody2 || !this.body1 || !this.body2) {
            return null;
        }
        var lastPoints = [Vector3.fromJSON(lastbody1.global.body.position).add(Quaternion.fromJSON(lastbody1.global.body.rotation).multiplyVector3(last.anchor1)),
        Vector3.fromJSON(lastbody2.global.body.position).add(Quaternion.fromJSON(lastbody2.global.body.rotation).multiplyVector3(last.anchor2))
        ]
        var points = this.getPoints();
        var lerped = [
            lastPoints[0].lerp(points[0], lerp),
            lastPoints[1].lerp(points[1], lerp)
        ];
        this.mesh.mesh.geometry.setFromPoints(lerped);
        this.mesh.mesh.geometry.attributes.position.needsUpdate = true;
    }

    solve() {
        this.point1 = this.body1.global.body.position.add(this.body1.global.body.rotation.multiplyVector3(this.anchor1));
        this.point2 = this.body2.global.body.position.add(this.body2.global.body.rotation.multiplyVector3(this.anchor2));
        var delta = this.point2.subtract(this.point1);
        var deltaLength = delta.magnitude();
        if (deltaLength == 0) {
            delta = new Vector3(0, 0.0001, 0);
            deltaLength = delta.magnitude();
        }
        var n = delta.scale(1 / deltaLength);
        var error = 0;
        if(deltaLength < this.upperBound && deltaLength > this.lowerBound){
            this.impulse = new Vector3();
            this.penetration = new Vector3();
            return;
        }
        if (deltaLength > this.upperBound) {
            error = deltaLength - this.upperBound;
        }
        else if (deltaLength < this.lowerBound) {
            error = deltaLength - this.lowerBound;
        }
        this.penetration = n.scale(error);
        var velocity1 = this.body1.getVelocityAtPosition(this.point1);
        var velocity2 = this.body2.getVelocityAtPosition(this.point2);
        var relVel = n.dot(velocity2.subtract(velocity1));

        if (!this.solved) {
            var radius1 = this.point1.subtract(this.body1.maxParent.global.body.position);
            var radius2 = this.point2.subtract(this.body2.maxParent.global.body.position);

            var rotationalEffects1 = n.dot(this.body1.maxParent.global.body.inverseMomentOfInertia.multiplyVector3(radius1.cross(n)).cross(radius1));
            var rotationalEffects2 = n.dot(this.body2.maxParent.global.body.inverseMomentOfInertia.multiplyVector3(radius2.cross(n)).cross(radius2));
            rotationalEffects1 = isFinite(rotationalEffects1) ? rotationalEffects1 : 0;
            rotationalEffects2 = isFinite(rotationalEffects2) ? rotationalEffects2 : 0;



            var invMass1 = this.body1.maxParent.global.body.inverseMass;
            var invMass2 = this.body2.maxParent.global.body.inverseMass;

            if (this.body1.maxParent.isImmovable()) {
                invMass1 = 0;
                rotationalEffects1 = 0;
            }
            if (this.body2.maxParent.isImmovable()) {
                invMass2 = 0;
                rotationalEffects2 = 0;
            }
            this.denominator = invMass1 * (1 - this.body1.maxParent.global.body.linearDamping.multiply(n).magnitude()) + rotationalEffects1 * (1 - this.body1.maxParent.global.body.angularDamping);

            this.denominator += invMass2 * (1 - this.body2.maxParent.global.body.linearDamping.multiply(n).magnitude()) + rotationalEffects2 * (1 - this.body2.maxParent.global.body.angularDamping);

            if (this.denominator == 0) {
                return false;
            }
        }
        var lambda = relVel / this.denominator;
        this.impulse = n.scale(lambda);
        this.solved = true;
        return true;
    }

    setMesh(options, gameEngine) {
        var geometry = new gameEngine.graphicsEngine.THREE.BufferGeometry().setFromPoints(this.getPoints());
        var material = new gameEngine.graphicsEngine.THREE.LineBasicMaterial({ color: options?.color ?? 0xff0000 });
        material.side = gameEngine.graphicsEngine.THREE.DoubleSide;
        var line = new gameEngine.graphicsEngine.THREE.Line(geometry, material);
        line.frustumCulled = false;
        this.mesh = gameEngine.graphicsEngine.meshLinker.createMeshData(line);
    }

    setMeshAndAddToScene(options, gameEngine) {
        this.setMesh(options, gameEngine);
        this.addToScene(gameEngine);
    }

    applyForces() {
        var f1 = this.body1.maxParent.getForceEffect(this.impulse, this.point);
        var f2 = this.body2.maxParent.getForceEffect(this.impulse.scale(-1), this.point);
        if (f1) {
            this.body1_netForce = f1[0]
            this.body1_netTorque = f1[1];
        }
        if (f2) {
            this.body2_netForce = f2[0]
            this.body2_netTorque = f2[1];
        }
    }

    copy() {
        var c = new this.constructor();

        c.body1 = this.body1;
        c.body2 = this.body2;
        c.anchor1 = this.anchor1;
        c.anchor2 = this.anchor2;

        c.solved = this.solved;
        c.lowerBound = this.lowerBound;
        c.upperBound = this.upperBound;

        c.combinedMaterial = this.combinedMaterial;
        return c;
    }

    toJSON() {

        var json = super.toJSON();

        json.impulse = this.impulse.toJSON();

        json.body1 = this.body1.id;
        json.body2 = this.body2.id;

        json.point1 = this.point1.toJSON();
        json.point2 = this.point2.toJSON();

        json.anchor1 = this.anchor1.toJSON();
        json.anchor2 = this.anchor2.toJSON();

        json.lowerBound = this.lowerBound;
        json.upperBound = this.upperBound;
        json.bias = this.bias;

        json.penetration = this.penetration.toJSON();
        json.denominator = this.denominator;
        json.solved = this.solved;

        return json;
    }

    static fromJSON(json, world) {
        var distanceConstraint = super.fromJSON(json, world);
        distanceConstraint.impulse = Vector3.fromJSON(json.impulse);
        distanceConstraint.body1 = json.body1;
        distanceConstraint.body2 = json.body2;
        distanceConstraint.point1 = Vector3.fromJSON(json.point1);
        distanceConstraint.point2 = Vector3.fromJSON(json.point2);
        distanceConstraint.anchor1 = Vector3.fromJSON(json.anchor1);
        distanceConstraint.anchor2 = Vector3.fromJSON(json.anchor2);
        distanceConstraint.lowerBound = json.upperBound;
        distanceConstraint.upperBound = json.upperBound;
        distanceConstraint.bias = json.bias;
        distanceConstraint.penetration = Vector3.fromJSON(json.penetration);
        distanceConstraint.denominator = json.denominator;
        distanceConstraint.solved = json.solved;
        return distanceConstraint;
    }

    updateReferences(gameEngine = this.gameEngine) {
        this.body1 = gameEngine.world.getByID(this.body1);
        this.body2 = gameEngine.world.getByID(this.body2);
        if (gameEngine) {
            this.gameEngine = gameEngine;
        }
    }
};

ClassRegistry.register(DistanceConstraint);


export default DistanceConstraint;