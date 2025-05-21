import Vector3 from "../Math3D/Vector3.mjs";
import CollisionContact from "./CollisionContact.mjs";
import Triangle from "../Shapes/Triangle.mjs";
import Composite from "../Shapes/Composite.mjs";
import Sphere from "../Shapes/Sphere.mjs";
import Polyhedron from "../Shapes/Polyhedron.mjs";
import Box from "../Shapes/Box.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";

const CollisionDetector = class {

    static seperatorCharacter = ":";

    /**
     * Constructs a new CollisionDetector with the specified options.
     * 
     * @param {Object} options - Configuration options for the collision detector.
     * @param {Map} [options.pairs] - A map to store shape pairs that can collide.
     * @param {Object} [options.world] - The world context in which collisions are detected.
     * @param {Array} [options.contacts] - An array to store detected collision contacts.
     * @param {number} [options.binarySearchDepth=4] - The depth for binary search operations.
     * @param {number} [options.iterations=4] - The number of iterations to perform in collision handling.
     * @param {number} [options.concavePolyhedronBinarySearchDepth=1] - The depth for binary search specific to concave polyhedrons.
     */
    constructor(options) {
        this.pairs = options?.pairs ?? new Map();
        this.world = options?.world ?? null;
        this.contacts = options?.contacts ?? [];
        this.handlers = {};
        this.binarySearchDepth = options?.binarySearchDepth ?? 4;
        this.iterations = options?.iterations ?? 4;
        this.concavePolyhedronBinarySearchDepth = options?.concavePolyhedronBinarySearchDepth ?? 1;
        this.initHandlers();
    }

    addContact(contact) {
        this.contacts.push(contact);
    }

    addPair(shape1, shape2) {
        if (shape1.id > shape2.id) {
            const temp = shape1;
            shape1 = shape2;
            shape2 = temp;
        }
        if (this.pairs.has(shape1.id + this.constructor.seperatorCharacter + shape2.id) || !(this.handlers[shape1.type]?.[shape2.type] || this.handlers[shape2.type]?.[shape1.type])) {
            return;
        }
        if (!shape1.canCollideWith(shape2)) {
            return;
        }

        if (!shape1.global.expandedHitbox.intersects(shape2.global.expandedHitbox)) {
            return;
        }


        return this.pairs.set(shape1.id + this.constructor.seperatorCharacter + shape2.id, [shape1, shape2]);
    }

    detectCollision(shape1, shape2) {
        if (shape1.maxParent == shape2.maxParent) {
            return false;
        }
        if (shape1.getLocalFlag(Composite.FLAGS.STATIC) && shape2.getLocalFlag(Composite.FLAGS.STATIC)) {
            return false;
        }
        if (shape1.type > shape2.type) {
            const temp = shape1;
            shape1 = shape2;
            shape2 = temp;
        }
        return this.handlers[shape1.type]?.[shape2.type]?.bind(this)(shape1, shape2);
    }

    initHandlers() {
        this.handlers[ClassRegistry.getTypeFromName("SPHERE")] = {};
        this.handlers[ClassRegistry.getTypeFromName("SPHERE")][ClassRegistry.getTypeFromName("SPHERE")] = this.handleSphereSphere;
        this.handlers[ClassRegistry.getTypeFromName("SPHERE")][ClassRegistry.getTypeFromName("TERRAIN3")] = this.handleSphereTerrain;
        this.handlers[ClassRegistry.getTypeFromName("SPHERE")][ClassRegistry.getTypeFromName("BOX")] = this.handleSphereBox;
        this.handlers[ClassRegistry.getTypeFromName("SPHERE")][ClassRegistry.getTypeFromName("POLYHEDRON")] = this.handleSpherePolyhedron;
        this.handlers[ClassRegistry.getTypeFromName("TERRAIN3")] = {};
        this.handlers[ClassRegistry.getTypeFromName("TERRAIN3")][ClassRegistry.getTypeFromName("POINT")] = this.handleTerrainPoint;
        this.handlers[ClassRegistry.getTypeFromName("BOX")] = {};
        top.ClassRegistry = ClassRegistry;
    }

    handle(shape) {
        const func = function (x) {
            this.addPair(shape, this.world.getByID(x));
            return false;
        }.bind(this);
        this.world.spatialHash.query(shape.id, func);
    }

    handleAll(shapes) {
        this.pairs.clear();
        for (var shape of shapes) {
            if (shape.maxParent.sleeping || shape.getLocalFlag(Composite.FLAGS.STATIC)) {
                continue;
            }
            this.handle(shape);
        }
    }


    resolveAll() {
        for (var value of this.pairs.values()) {
            this.detectCollision(value[0], value[1]);
        }
        this.resolveAllContacts();
    }

    broadphase(shape1, shape2) {
        return shape1.global.hitbox.intersects(shape2.global.hitbox);
    }

    resolveAllContacts() {
        this.contacts = this.contacts.concat(this.world.constraints);
        const maxParentMap = new Object(null);

        for (const contact of this.contacts) {
            contact.solved = false;
            contact.material = contact.body1.material.getCombined(contact.body2.material);
            if (!maxParentMap[contact.body1.maxParent.id]) {
                maxParentMap[contact.body1.maxParent.id] = { penetrationSum: 0 };
            }

            if (!maxParentMap[contact.body2.maxParent.id]) {
                maxParentMap[contact.body2.maxParent.id] = { penetrationSum: 0 };
            }

            if (contact.body1.isSensor || contact.body2.isSensor && contact.constructor.name == "COLLISIONCONTACT") {
                contact.ignore = true;
            }
            var body1Map = maxParentMap[contact.body1.maxParent.id];
            var body2Map = maxParentMap[contact.body2.maxParent.id];
            contact.body1Map = body1Map;
            contact.body2Map = body2Map;
        }

        for (var iter = 0; iter < this.iterations; iter++) {
            for (const contact of this.contacts) {
                if (contact.ignore || !contact.solve()) {
                    continue;
                }
                const a = contact.body1.maxParent;
                const b = contact.body2.maxParent;
                const a_body = a.global.body;
                const b_body = b.global.body;
                contact.applyForces();
                a_body.setVelocity(a_body.getVelocity().add(contact.body1_netForce.scale(a_body.inverseMass).multiply(new Vector3(1 - a_body.linearDamping.x, 1 - a_body.linearDamping.y, 1 - a_body.linearDamping.z))));
                b_body.setVelocity(b_body.getVelocity().add(contact.body2_netForce.scale(b_body.inverseMass).multiply(new Vector3(1 - b_body.linearDamping.x, 1 - b_body.linearDamping.y, 1 - b_body.linearDamping.z))));
                a_body.angularVelocity.addInPlace(a_body.inverseMomentOfInertia.multiplyVector3(contact.body1_netTorque).scale(1 - a_body.angularDamping));
                b_body.angularVelocity.addInPlace(b_body.inverseMomentOfInertia.multiplyVector3(contact.body2_netTorque).scale(1 - b_body.angularDamping));
                a.syncAll();
                b.syncAll();
            }
        }

        for (const contact of this.contacts) {
            if (contact.ignore) {
                continue;
            }
            contact.body1Map.penetrationSum += contact.penetration.magnitudeSquared();
            contact.body2Map.penetrationSum += contact.penetration.magnitudeSquared();
            contact.body1.contacts = [];
            contact.body2.contacts = [];
        }

        for (const contact of this.contacts) {
            if (contact.ignore) {
                contact.body1.dispatchEvent("collision", [contact]);
                contact.body2.dispatchEvent("collision", [contact]);
                continue;
            }
            contact.body1.contacts.push(contact.body2.id);
            contact.body2.contacts.push(contact.body1.id);
            var translation = contact.penetration;
            var totalMass = contact.body1.maxParent.getEffectiveTotalMass(contact.normal) + contact.body2.maxParent.getEffectiveTotalMass(contact.normal);
            var massRatio2 = contact.body2.maxParent.getEffectiveTotalMass() / totalMass;
            massRatio2 = isNaN(massRatio2) ? 1 : massRatio2;
            var massRatio1 = contact.body1.maxParent.getEffectiveTotalMass() / totalMass;
            massRatio1 = isNaN(massRatio1) ? 1 : massRatio1;


            if (contact.body1Map.penetrationSum != 0) {
                contact.body1.translate(translation.scale(contact.penetration.magnitudeSquared() / contact.body1Map.penetrationSum * massRatio2));
            }
            if (contact.body2Map.penetrationSum != 0) {
                contact.body2.translate(translation.scale(-contact.penetration.magnitudeSquared() / contact.body2Map.penetrationSum * massRatio1));
            }
            if (contact.constructor.name == "COLLISIONCONTACT") {
                contact.body1.dispatchEvent("collision", [contact]);
                contact.body2.dispatchEvent("collision", [contact]);
            }
        }
        this.contacts.length = 0;
    }

    clampPointToAABB(v, aabb) {
        v = v.copy();
        const x = aabb.width * 0.5;
        const y = aabb.height * 0.5;
        const z = aabb.depth * 0.5;
        if (v.x < -x) {
            v.x = -x;
        }
        else if (v.x > x) {
            v.x = x;
        }
        if (v.y < -y) {
            v.y = -y;
        }
        else if (v.y > y) {
            v.y = y;
        }
        if (v.z < -z) {
            v.z = -z;
        }
        else if (v.z > z) {
            v.z = z;
        }
        return v;
    }

    closestPointToAABB(v, aabb, clamped = this.clampPointToAABB(v, aabb)) {
        v = v.copy();
        const x = aabb.width * 0.5;
        const y = aabb.height * 0.5;
        const z = aabb.depth * 0.5;
        var dx = Math.abs(v.x - x);
        var dy = Math.abs(v.y - y);
        var dz = Math.abs(v.z - z);

        var min_dist = Math.min(dx, dy, dz);
        if (min_dist === dx) {
            clamped.x = v.x > 0 ? x : -x;
        } else if (min_dist === dy) {
            clamped.y = v.y > 0 ? y : -y;
        } else {
            clamped.z = v.z > 0 ? z : -z;
        }
        return clamped;
    }

    closestPointOnTriangle(p, a, b, c) {
        const abx = b.x - a.x
        const aby = b.y - a.y;
        const abz = b.z - a.z;
        const acx = c.x - a.x;
        const acy = c.y - a.y;
        const acz = c.z - a.z;
        const apx = p.x - a.x;
        const apy = p.y - a.y;
        const apz = p.z - a.z;

        const d1 = abx * apx + aby * apy + abz * apz;
        const d2 = acx * apx + acy * apy + acz * apz;
        if (d1 <= 0 && d2 <= 0) {
            return new Vector3(a.x, a.y, a.z);
        }

        const bpx = p.x - b.x;
        const bpy = p.y - b.y;
        const bpz = p.z - b.z;
        const d3 = abx * bpx + aby * bpy + abz * bpz;
        const d4 = acx * bpx + acy * bpy + acz * bpz;
        if (d3 >= 0 && d4 <= d3) {
            return new Vector3(b.x, b.y, b.z);
        }

        const cpx = p.x - c.x;
        const cpy = p.y - c.y;
        const cpz = p.z - c.z;
        const d5 = abx * cpx + aby * cpy + abz * cpz;
        const d6 = acx * cpx + acy * cpy + acz * cpz;
        if (d6 >= 0 && d5 <= d6) {
            return new Vector3(c.x, c.y, c.z);
        }

        const vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            return new Vector3(a.x + abx * v, a.y + aby * v, a.z + abz * v);
        }

        const vb = d5 * d2 - d1 * d6;
        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            const w = d2 / (d2 - d6);
            return new Vector3(a.x + acx * w, a.y + acy * w, a.z + acz * w);
        }

        const va = d3 * d6 - d5 * d4;
        if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
            const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
            const bcx = c.x - b.x, bcy = c.y - b.y, bcz = c.z - b.z;
            return new Vector3(b.x + bcx * w, b.y + bcy * w, b.z + bcz * w);
        }

        const denom = 1 / (va + vb + vc);
        const v = vb * denom;
        const w = vc * denom;
        return new Vector3(a.x + abx * v + acx * w, a.y + aby * v + acy * w, a.z + abz * v + acz * w);
    }



    horizontalRayIntersectsTriangle(orig, a, b, c) {
        const EPSILON = 1e-6;
        const ax = a.x;
        const ay = a.y;
        const az = a.z;
        const edge1x = b.x - ax;
        const edge1y = b.y - ay;
        const edge1z = b.z - az;
        const edge2x = c.x - ax;
        const edge2y = c.y - ay;
        const edge2z = c.z - az;
        const aDot = edge2y * edge1z - edge2z * edge1y;
        if (Math.abs(aDot) < EPSILON) {
            return false;
        }
        const f = 1 / aDot;
        const sx = orig.x - ax;
        const sy = orig.y - ay;
        const sz = orig.z - az;
        var u = f * (sz * edge2y - sy * edge2z);
        if (u < 0 || u >= 1) {
            return false;
        }
        const qx = sy * edge1z - sz * edge1y;
        const qy = sz * edge1x - sx * edge1z;
        const qz = sx * edge1y - sy * edge1x;
        const v = f * qx;
        if (v < 0 || u + v >= 1) {
            return false;
        }
        const t = f * (edge2x * qx + edge2y * qy + edge2z * qz);
        return t > EPSILON;
    }

    /**
 * @param {Sphere} sphere
 * @param {Polyhedron} poly
 * @returns {number}
 */

    handleSpherePolyhedron(sphere, poly) {
        var spherePos = null;
        var closestPoint = null;
        var minDistanceSquared = Infinity;
        var polyPos = null;
        var relativePos = null;
        var inside = 0;
        var minT = 0;
        var maxT = 1;
        var timeOfImpact = this.timeOfImpactAABBAABB(sphere.global.hitbox.translate(sphere.global.body.getVelocity().scale(-1)), sphere.global.body.getVelocity().scale(1), poly.global.hitbox.translate(poly.global.body.getVelocity().scale(-1)), poly.global.body.getVelocity().scale(1));
        if (timeOfImpact != null) {
            timeOfImpact[0] = Math.min(1, Math.max(0, timeOfImpact[0]));
            timeOfImpact[1] = Math.min(1, Math.max(0, timeOfImpact[1]));
            if (timeOfImpact[0] < 0.001) {
                timeOfImpact[1] = 1;
            }
            minT = timeOfImpact[0];
            maxT = timeOfImpact[1];
        }
        var closestNormal = null;
        var isInside = false;
        var tempVec = new Vector3(1, 1, 1).scale(sphere.radius);
        var min = new Vector3();
        var max = new Vector3();
        var binarySearch = function (t, disableHitbox = false) {
            spherePos = sphere.global.body.previousPosition.lerp(sphere.global.body.position, t);
            polyPos = poly.global.body.previousPosition.lerp(poly.global.body.position, t);
            relativePos = poly.global.body.rotation.conjugate().multiplyVector3(spherePos.subtract(polyPos));
            closestPoint = null;
            closestNormal = null;
            minDistanceSquared = Infinity;
            inside = 0;
            isInside = poly.isConvex;

            for (var face = 0; face < poly.faces.length; face++) {
                var a = poly.localVertices[poly.faces[face][0]];
                var b = poly.localVertices[poly.faces[face][1]];
                var c = poly.localVertices[poly.faces[face][2]];
                min.x = Math.min(a.x, b.x, c.x);
                max.x = Math.max(a.x, b.x, c.x);

                min.y = Math.min(a.y, b.y, c.y);
                max.y = Math.max(a.y, b.y, c.y);

                min.z = Math.min(a.z, b.z, c.z);
                max.z = Math.max(a.z, b.z, c.z);

                if (!poly.isConvex && this.horizontalRayIntersectsTriangle(relativePos, a, b, c)) {
                    inside++;
                }
                var normal = poly.normals[face].copy();

                if (poly.isConvex && a.subtract(relativePos).dot(normal) < 0) {
                    isInside = false;
                }
                if (!disableHitbox && !(min.x <= relativePos.x + tempVec.x && max.x >= relativePos.x - tempVec.x && min.y <= relativePos.y + tempVec.y && max.y >= relativePos.y - tempVec.y && min.z <= relativePos.z + tempVec.z && max.z >= relativePos.z - tempVec.z)) {
                    continue;
                }



                var closest = this.closestPointOnTriangle(relativePos, a, b, c);
                var distSq = closest.subtract(relativePos).magnitudeSquared();
                if (distSq < minDistanceSquared) {
                    minDistanceSquared = distSq;
                    closestPoint = closest;
                    closestNormal = normal;
                }
            }
            if (inside % 2 == 1) {
                isInside = true;
                if (closestPoint && closestPoint.subtract(relativePos).dot(closestNormal) < 0) {
                    isInside = false;
                }
            }
            if (isInside) {
                return -(minDistanceSquared + sphere.radius * sphere.radius);
            }
            return minDistanceSquared - sphere.radius * sphere.radius;
        }.bind(this);

        var t = 1;
        var depth = poly.isConvex ? this.binarySearchDepth : this.concavePolyhedronBinarySearchDepth;
        for (var i = 0; i < depth; i++) {
            t = minT + (maxT - minT) * 0.333333;
            var result = binarySearch(t);
            if (result > 0) {
                minT = t;
            } else {
                maxT = t;
            }
        }
        t = maxT;

        const bin = binarySearch(t, !Number.isFinite(minDistanceSquared));
        if (bin > 0 || !closestPoint) {
            return false;
        }

        const closestPoint2 = poly.global.body.rotation.multiplyVector3(closestPoint).addInPlace(polyPos);
        const contact = new CollisionContact();
        contact.point = poly.translateLocalToWorld(closestPoint);
        contact.normal = spherePos.subtract(closestPoint2).normalizeInPlace();
        if (contact.normal.magnitudeSquared() == 0) {
            contact.normal = closestNormal;
        }
        if (isInside) {
            contact.normal.scaleInPlace(-1);
        }

        contact.penetration = contact.normal.scale(sphere.radius).add(contact.point.subtract(sphere.global.body.position).projectOnto(contact.normal));

        contact.body1 = sphere;
        contact.body2 = poly;
        contact.point = sphere.global.body.position.subtract(contact.normal.scale(sphere.radius));

        this.addContact(contact);
        return true;

    }

    computeInterval(min1, max1, min2, max2, relVel) {
        if (relVel == 0) {
            if (max1 < min2 || max2 < min1) {
                return null;
            }
            return [-Infinity, Infinity];
        }

        const t1 = (min2 - max1) / relVel;
        const t2 = (max2 - min1) / relVel;

        return [Math.min(t1, t2), Math.max(t1, t2)];
    }
    timeOfImpactAABBAABB(aabb1, vel1, aabb2, vel2) {
        const a1minX = aabb1.min.x;
        const a1maxX = aabb1.max.x;
        const a1minY = aabb1.min.y;
        const a1maxY = aabb1.max.y;
        const a2minX = aabb2.min.x;
        const a2maxX = aabb2.max.x;
        const a2minY = aabb2.min.y;
        const a2maxY = aabb2.max.y;

        const relVelX = vel1.x - vel2.x;
        const relVelY = vel1.y - vel2.y;

        const intervalX = this.computeInterval(a1minX, a1maxX, a2minX, a2maxX, relVelX);
        const intervalY = this.computeInterval(a1minY, a1maxY, a2minY, a2maxY, relVelY);

        if (intervalX === null || intervalY === null) {
            return null;
        }

        const tEntry = Math.max(intervalX[0], intervalY[0]);
        const tExit = Math.min(intervalX[1], intervalY[1]);

        if (tEntry > tExit || tExit <= 0) {
            return null;
        }

        const collisionStart = tEntry < 0 ? 0 : tEntry;
        return [collisionStart, tExit];
    }


    handleSphereBox(sphere, box) {

        var spherePos = null;
        var closestPoint = null;
        var minDistanceSquared = Infinity;
        var boxPos = null;
        var relativePos = null;
        var inside = false;
        var minT = 0;
        var maxT = 1;
        var timeOfImpact = this.timeOfImpactAABBAABB(sphere.global.hitbox.translate(sphere.global.body.getVelocity().scale(-1)), sphere.global.body.getVelocity().scale(1), box.global.hitbox.translate(box.global.body.getVelocity().scale(-1)), box.global.body.getVelocity().scale(1));
        if (timeOfImpact != null) {
            timeOfImpact[0] = Math.min(1, Math.max(0, timeOfImpact[0]));
            timeOfImpact[1] = Math.min(1, Math.max(0, timeOfImpact[1]));
            if (timeOfImpact[0] < 0.001) {
                timeOfImpact[1] = 1;
            }
            minT = timeOfImpact[0];
            maxT = timeOfImpact[1];
        }

        var binarySearch = function (t) {
            spherePos = sphere.global.body.previousPosition.lerp(sphere.global.body.position, t);
            boxPos = box.global.body.previousPosition.lerp(box.global.body.position, t);
            relativePos = box.global.body.rotation.conjugate().multiplyVector3(spherePos.subtract(boxPos));
            closestPoint = null;
            minDistanceSquared = Infinity;
            inside = false;

            const clampedPoint = this.clampPointToAABB(relativePos, box);
            inside = clampedPoint.equals(relativePos);
            if (inside) {
                closestPoint = this.closestPointToAABB(relativePos, box, clampedPoint);
            }
            else {
                closestPoint = clampedPoint;
            }
            minDistanceSquared = closestPoint.subtract(relativePos).magnitudeSquared();
            return (inside ? -1 : 1) * (minDistanceSquared - (inside ? -1 : 1) * sphere.radius * sphere.radius);
        }.bind(this);

        var t = maxT;
        for (var i = 0; i < this.binarySearchDepth; i++) {
            t = minT + (maxT - minT) * 0.333333;
            var result = binarySearch(t);
            if (result > 0) {
                minT = t;
            } else {
                maxT = t;
            }
        }
        t = maxT;
        if (binarySearch(t) > 0) {
            return false;
        }

        const contact = new CollisionContact();
        contact.point = box.translateLocalToWorld(closestPoint);
        contact.normal = spherePos.subtract(contact.point).normalizeInPlace();
        if (inside) {
            contact.normal.scaleInPlace(-1);
        }
        contact.penetration = contact.normal.scale(sphere.radius).add(contact.point.subtract(sphere.global.body.position).projectOnto(contact.normal));
        contact.body1 = sphere;
        contact.body2 = box;
        contact.point = sphere.global.body.position.subtract(contact.normal.scale(sphere.radius));
        this.addContact(contact);

        return true;


    }

    handleSphereSphere(sphere1, sphere2) {

        var minT = 0;
        var maxT = 1;
        var timeOfImpact = this.timeOfImpactAABBAABB(sphere1.global.hitbox.translate(sphere1.global.body.getVelocity().scale(-1)), sphere1.global.body.getVelocity().scale(1), sphere2.global.hitbox.translate(sphere2.global.body.getVelocity().scale(-1)), sphere2.global.body.getVelocity().scale(1));
        if (timeOfImpact != null) {
            timeOfImpact[0] = Math.min(1, Math.max(0, timeOfImpact[0]));
            timeOfImpact[1] = Math.min(1, Math.max(0, timeOfImpact[1]));
            if (timeOfImpact[0] < 0.001) {
                timeOfImpact[1] = 1;
            }
            minT = timeOfImpact[0];
            maxT = timeOfImpact[1];
        }
        var sphere1Pos = null;
        var sphere2Pos = null;
        var distanceSquared = null;
        var binarySearch = function (t) {
            sphere1Pos = sphere1.global.body.previousPosition.lerp(sphere1.global.body.position, t);
            sphere2Pos = sphere2.global.body.previousPosition.lerp(sphere2.global.body.position, t);
            distanceSquared = sphere1Pos.subtract(sphere2Pos).magnitudeSquared();
            return distanceSquared - (sphere1.radius + sphere2.radius) * (sphere1.radius + sphere2.radius);
        }.bind(this);
        var t = 1;
        for (var i = 0; i < this.binarySearchDepth; i++) {
            t = minT + (maxT - minT) * 0.333333;
            var result = binarySearch(t);
            if (result > 0) {
                minT = t;
            } else {
                maxT = t;
            }
        }
        t = maxT;

        const isColliding = binarySearch(t) < 0;

        if (!isColliding) {
            return false;
        }
        const distanceTo = sphere1.global.body.position.distance(sphere2.global.body.position);

        const contact = new CollisionContact();
        contact.normal = sphere1Pos.subtract(sphere2Pos).normalizeInPlace();
        if (contact.normal.magnitudeSquared() == 0) {
            contact.normal = new Vector3(1, 0, 0);
        }
        contact.point = sphere1.global.body.position.add(sphere2.global.body.position).scale(0.5);

        contact.body1 = sphere1;
        contact.body2 = sphere2;
        const penetration = sphere1.radius + sphere2.radius - distanceTo;

        contact.penetration = contact.normal.scale(penetration);

        this.addContact(contact);
        return;
    }

    handleSphereTerrain(sphere1, terrain1) {
        var heightmapSphereWidth = sphere1.radius * terrain1.inverseTerrainScale;
        var spherePos = null;
        var terrainPos = null;
        var relativePos = null;
        var heightmapPos = null;
        var min = null;
        var max = null;
        var binarySearch = function (t, getData = false) {
            spherePos = sphere1.global.body.previousPosition.lerp(sphere1.global.body.position, t);
            terrainPos = terrain1.global.body.previousPosition.lerp(terrain1.global.body.position, t);
            relativePos = terrain1.global.body.rotation.conjugate().multiplyVector3(spherePos.subtract(terrainPos));
            heightmapPos = terrain1.translateLocalToHeightmap(relativePos);
            if (heightmapPos.x <= -heightmapSphereWidth || heightmapPos.x >= terrain1.heightmaps.widthSegments + heightmapSphereWidth || heightmapPos.z <= -heightmapSphereWidth || heightmapPos.z >= terrain1.heightmaps.depthSegments + heightmapSphereWidth) {
                return 1;
            }
            var currentHeight = 0;
            var currentTriangle = terrain1.getTriangle(terrain1.heightmaps.top, heightmapPos);
            if (currentTriangle) {
                var currentHeight = relativePos.y - currentTriangle.getHeight(heightmapPos).y;
                if (currentHeight < sphere1.radius) {
                    return currentHeight - sphere1.radius;
                }
            }

            return 1;
        }
        var minT = 0;
        var maxT = 1;
        var timeOfImpact = this.timeOfImpactAABBAABB(sphere1.global.hitbox.translate(sphere1.global.body.getVelocity().scale(-1)), sphere1.global.body.getVelocity().scale(1), terrain1.global.hitbox.translate(terrain1.global.body.getVelocity().scale(-1)), terrain1.global.body.getVelocity().scale(1));
        if (timeOfImpact != null) {
            timeOfImpact[0] = Math.min(1, Math.max(0, timeOfImpact[0]));
            timeOfImpact[1] = Math.min(1, Math.max(0, timeOfImpact[1]));
            if (timeOfImpact[0] < 0.001) {
                timeOfImpact[1] = 1;
            }
            minT = timeOfImpact[0];
            maxT = timeOfImpact[1];
        }
        var t = 1;
        for (var i = 0; i < this.binarySearchDepth; i++) {
            t = minT + (maxT - minT) * 0.333333;
            var result = binarySearch(t);
            if (result > 0) {
                minT = t;
            } else {
                maxT = t;
            }
        }
        t = maxT;
        binarySearch(t);

        var currentHeight = 0;
        var currentTriangle = terrain1.getTriangle(terrain1.heightmaps.top, heightmapPos);
        if (currentTriangle) {
            var currentHeight = relativePos.y - currentTriangle.getHeight(heightmapPos).y;
            if (currentHeight < 0) {
                currentTriangle.a = terrain1.translateHeightmapToWorld(currentTriangle.a);
                currentTriangle.b = terrain1.translateHeightmapToWorld(currentTriangle.b);
                currentTriangle.c = terrain1.translateHeightmapToWorld(currentTriangle.c);
                var normal = currentTriangle.getNormal();
                var spherePos2 = sphere1.global.body.position;
                var intersection = currentTriangle.intersectsSphere(spherePos2);
                if (intersection) {
                    var contact = new CollisionContact();
                    contact.point = intersection;
                    contact.normal = normal;
                    contact.penetration = intersection.subtract(spherePos2);
                    contact.body1 = sphere1;
                    contact.body2 = terrain1;


                    this.addContact(contact);
                }
            }
        }

        var min = new Vector3(heightmapPos.x - heightmapSphereWidth - 1, 0, heightmapPos.z - heightmapSphereWidth - 1);
        var max = new Vector3(heightmapPos.x + heightmapSphereWidth + 1, 0, heightmapPos.z + heightmapSphereWidth + 1);

        for (var x = min.x; x <= max.x; x++) {
            for (var z = min.z; z <= max.z; z++) {
                var triangles = terrain1.getTrianglePair(terrain1.heightmaps.top, new Vector3(x, 0, z));
                if (!triangles) {
                    continue;
                }
                for (var t of triangles) {
                    t.a = terrain1.translateHeightmapToWorld(t.a);
                    t.b = terrain1.translateHeightmapToWorld(t.b);
                    t.c = terrain1.translateHeightmapToWorld(t.c);
                    spherePos2 = sphere1.global.body.position;
                    var intersection = t.intersectsSphere(spherePos2);
                    if (!intersection) {
                        continue;
                    }
                    var contact = new CollisionContact();
                    contact.point = intersection;
                    contact.penetration = sphere1.radius - contact.point.distance(spherePos2);
                    contact.normal = t.getNormal();//contact.point.subtract(spherePos2).normalizeInPlace();
                    if (contact.penetration <= 0) {
                        continue;
                    }

                    if (contact.normal.magnitudeSquared() == 0) {
                        contact.normal = new Vector3(1, 0, 0);
                    }
                    contact.body1 = sphere1;
                    contact.body2 = terrain1;

                    contact.penetration = contact.normal.scale(contact.penetration);
                    this.addContact(contact);
                }
            }
        }
    }

    handleTerrainPoint(terrain1, point1, manual = false) {
        var pointPos = point1.global.body.position;

        var pointPosPrev = point1.global.body.previousPosition;
        var translatedPointPos = terrain1.translateWorldToLocal(pointPos);
        var heightmapPos = terrain1.translateLocalToHeightmap(translatedPointPos);
        var translatedPointPosPrev = terrain1.translateWorldToLocal(pointPosPrev);
        var heightmapPosPrev = terrain1.clampToHeightmap(terrain1.translateLocalToHeightmap(translatedPointPosPrev));

        if (heightmapPos.x <= 0 || heightmapPos.x >= terrain1.heightmaps.widthSegments || heightmapPos.z <= 0 || heightmapPos.z >= terrain1.heightmaps.depthSegments) {
            return false;
        }

        var triangleTop = terrain1.getTriangle(terrain1.heightmaps.top, heightmapPos);
        var triangleBottom = terrain1.getTriangle(terrain1.heightmaps.bottom, heightmapPos);

        var triangle = new Triangle(triangleTop.a.add(triangleBottom.a).scaleInPlace(0.5), triangleTop.b.add(triangleBottom.b).scaleInPlace(0.5), triangleTop.c.add(triangleBottom.c).scaleInPlace(0.5));


        var height = 0;
        var top = true;
        var normal = new Vector3(1, 0, 0);
        var height1 = triangle.getHeight(heightmapPosPrev);
        var height2 = triangle.getHeight(heightmapPosPrev);
        // if(1==0 && heightmapPos.y > height1.y && heightmapPosPrev.y > height2.y){

        //     top = true;
        // }
        // else if(1==0 && heightmapPos.y < height1.y && heightmapPosPrev.y < height2.y){
        //     top = false;
        // }
        // else{
        //     var triangle2 = triangle.copy();
        //     triangle2.a = terrain1.translateHeightmapToWorld(triangle2.a);
        //     triangle2.b = terrain1.translateHeightmapToWorld(triangle2.b);
        //     triangle2.c = terrain1.translateHeightmapToWorld(triangle2.c);

        //     var velocity = point1.global.body.getVelocity();//pointPos.subtract(p);
        //     normal = triangle2.getNormal();
        //     var pointVelocity = velocity.dot(normal);
        //     if(pointVelocity > 0){
        //         //top = false;
        //     }
        // }

        if (top) {
            var height = terrain1.translateHeightmapToWorld(triangleTop.getHeight(heightmapPos));
            var triangle2 = triangleTop.copy();
            triangle2.a = terrain1.translateHeightmapToWorld(triangle2.a);
            triangle2.b = terrain1.translateHeightmapToWorld(triangle2.b);
            triangle2.c = terrain1.translateHeightmapToWorld(triangle2.c);
            var normal = triangle2.getNormal();
            var contact = new CollisionContact();
            contact.normal = normal;
            contact.penetration = triangle2.a.subtract(pointPos).dot(contact.normal);
            if (contact.penetration <= 0 && !manual) {
                return false;
            }
            contact.body1 = point1;
            contact.body2 = terrain1;
            contact.point = point1.global.body.position;
            contact.penetration = contact.normal.scale(contact.penetration);
            if (!manual) {
                this.addContact(contact);
            }
            return contact;
        }
        else {
            var height = terrain1.translateHeightmapToWorld(triangleBottom.getHeight(heightmapPos));
            if (pointPos.y > height.y) {
                //point1.translate(new Vector3(0, height.y - pointPos.y, 0));
            }
        }

        //return true;
        /*
        var height = terrain1.getHeightFromHeightmap(terrain1.heightmaps.top, point1.global.body.position.copy());
        if(height != null){
            if(point1.global.body.position.y < height.y){
                point1.global.body.position = height.copy();
            }
        }
        return true;*/
        return false;
    }

    toJSON() {
        return {
            binarySearchDepth: this.binarySearchDepth
        };
    }

    static fromJSON(json, world) {
        var collisionDetector = new CollisionDetector({
            world: world
        });
        collisionDetector.binarySearchDepth = json.binarySearchDepth;
        return collisionDetector;
    }
};


export default CollisionDetector;