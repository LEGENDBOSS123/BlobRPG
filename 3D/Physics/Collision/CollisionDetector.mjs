import Vector3 from "../Math3D/Vector3.mjs";
import CollisionContact from "./CollisionContact.mjs";
import Triangle from "../Shapes/Triangle.mjs";
import Composite from "../Shapes/Composite.mjs";
import Sphere from "../Shapes/Sphere.mjs";
import Polyhedron from "../Shapes/Polyhedron.mjs";
import Terrain3 from "../Shapes/Terrain3.mjs";
import Point from "../Shapes/Point.mjs";
import Hitbox3 from "../Broadphase/Hitbox3.mjs";
import Box from "../Shapes/Box.mjs";
import World from "../Core/World.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";
import DistanceConstraint from "./DistanceConstraint.mjs";
import SphereSphere from "./SphereSphere.mjs";
import SphereBox from "./SphereBox.mjs";
import SpherePolyhedron from "./SpherePolyhedron.mjs";
import BoxBox from "./BoxBox.mjs";

/**
 * Constructs a new CollisionDetector with the specified options.
 * 
 * @typedef {Object} CollisionDetectorOptions - Configuration options for the collision detector.
 * @param {Map<string, Array<Composite>>} [pairs] - A map to store shape pairs that can collide.
 * @param {World} [world] - The world context in which collisions are detected.
 * @param {Array<CollisionContact>} [contacts] - An array to store detected collision contacts.
 * @param {number} [binarySearchDepth=4] - The depth for binary search operations.
 * @param {number} [velocityIterations=16] - The number of iterations to perform in collision handling.
 * @param {number} [penetrationIterations=16] - The number of iterations to perform in collision handling.
 * @param {number} [concavePolyhedronBinarySearchDepth=0] - The depth for binary search specific to concave polyhedrons.
 * @param {number} [GJKBinarySearchDepth=0] - The depth for binary search in GJK algorithm.
 */


const CollisionDetector = class {

    static EPA_MAX_ITERATIONS = 64;
    static seperatorCharacter = ":";


    /**
     * @param {CollisionDetectorOptions} options
     */
    constructor(options) {
        this.pairs = options?.pairs ?? new Map();
        this.world = options?.world ?? null;
        this.contacts = options?.contacts ?? [];
        this.handlers = {};
        this.binarySearchDepth = options?.binarySearchDepth ?? 4;
        this.velocityIterations = options?.velocityIterations ?? 16;
        this.penetrationIterations = options?.penetrationIterations ?? 16;
        this.concavePolyhedronBinarySearchDepth = options?.concavePolyhedronBinarySearchDepth ?? 0;
        this.GJKBinarySearchDepth = options?.GJKBinarySearchDepth ?? 0;
        this.maxParents = new Set();
        this.handleFunc = function (x, y) {
            this.addPair(this.world.getByID(x), this.world.getByID(y));
        }.bind(this);
        this.initHandlers();
    }

    /**
     * Adds a contact.
     * @param {CollisionContact} contact 
     */
    addContact(contact) {
        this.contacts.push(contact);
    }


    /**
     * Adds a pair.
     * @param {Composite} shape1 
     * @param {Composite} shape2 
     * @returns 
     */
    addPair(shape1, shape2) {
        if (!shape1.canCollideWith(shape2)) {
            return;
        }
        if (!shape1.global.expandedHitbox.intersects(shape2.global.expandedHitbox)) {
            return;
        }
        if (shape1.id > shape2.id) {
            const temp = shape1;
            shape1 = shape2;
            shape2 = temp;
        }
        if (this.pairs.has(shape1.id + this.constructor.seperatorCharacter + shape2.id) || !(this.handlers[shape1.type]?.[shape2.type] || this.handlers[shape2.type]?.[shape1.type])) {
            return;
        }

        return this.pairs.set(shape1.id + this.constructor.seperatorCharacter + shape2.id, [shape1, shape2]);
    }

    /**
     * Detects collision between two shapes.
     * @param {Composite} shape1 
     * @param {Composite} shape2 
     * @returns 
     */
    detectCollision(shape1, shape2) {
        if (shape1.type > shape2.type) {
            const temp = shape1;
            shape1 = shape2;
            shape2 = temp;
        }
        if (this.handlers[shape1.type]?.[shape2.type]) {
            const [minT, maxT] = this.getMinMaxTime(shape1, shape2);
            this.handlers[shape1.type]?.[shape2.type].handle(this, shape1, shape2, minT, maxT);
        }
    }

    /**
     * Initializes collision handlers.
     */
    initHandlers() {
        this.handlers[ClassRegistry.getTypeFromName("SPHERE")] = {};
        this.handlers[ClassRegistry.getTypeFromName("TERRAIN3")] = {};
        this.handlers[ClassRegistry.getTypeFromName("BOX")] = {};

        this.handlers[ClassRegistry.getTypeFromName("SPHERE")][ClassRegistry.getTypeFromName("SPHERE")] = SphereSphere;
        // this.handlers[ClassRegistry.getTypeFromName("SPHERE")][ClassRegistry.getTypeFromName("TERRAIN3")] = this.handleSphereTerrain;
        this.handlers[ClassRegistry.getTypeFromName("SPHERE")][ClassRegistry.getTypeFromName("BOX")] = SphereBox;
        this.handlers[ClassRegistry.getTypeFromName("SPHERE")][ClassRegistry.getTypeFromName("POLYHEDRON")] = SpherePolyhedron;
        // this.handlers[ClassRegistry.getTypeFromName("TERRAIN3")][ClassRegistry.getTypeFromName("POINT")] = this.handleTerrainPoint;
        this.handlers[ClassRegistry.getTypeFromName("BOX")][ClassRegistry.getTypeFromName("BOX")] = BoxBox;
    }

    /**
     * 
     * @param {Composite} shape 
     */
    handle(shape) {
        this.world.spatialHash.query(shape.id, this.handleFunc);
    }

    /**
     * 
     * @param {Array<Composite>} shapes 
     */
    handleAll(shapes) {
        this.pairs.clear();
        for (const shape of shapes) {
            if (shape.maxParent.sleeping || shape.getLocalFlag(Composite.FLAGS.STATIC)) {
                continue;
            }
            this.handle(shape);
        }
    }

    resolveAll() {
        for (const value of this.pairs.values()) {
            this.detectCollision(value[0], value[1]);
        }
        this.resolveAllContacts();
    }

    /**
     * 
     * @param {Composite} shape1 
     * @param {Composite} shape2 
     * @returns 
     */
    broadphase(shape1, shape2) {
        return shape1.global.hitbox.intersects(shape2.global.hitbox);
    }

    resolveAllContacts() {

        for (const constraint of this.world.constraints) {
            this.contacts.push(constraint);
        }
        for (const contact of this.contacts) {
            contact.solved = false;
            contact.material = contact.body1.material.getCombined(contact.body2.material);

            if (contact.body1.isSensor || contact.body2.isSensor && contact.constructor.name == "COLLISIONCONTACT") {
                contact.ignore = true;
            }
            contact.body1.maxParent.translation.reset();
            contact.body2.maxParent.translation.reset();
            contact.body1.distanceToMaxParent = contact.body1.maxParent.global.body.position.subtract(contact.body1.global.body.position);
            contact.body2.distanceToMaxParent = contact.body2.maxParent.global.body.position.subtract(contact.body2.global.body.position);

            this.maxParents.add(contact.body1.maxParent);
            this.maxParents.add(contact.body2.maxParent);
        }

        var tmpVec1 = new Vector3();
        var tmpVec2 = new Vector3();

        for (var iter = 0; iter < this.velocityIterations; iter++) {
            for (const contact of this.contacts) {
                if (!contact.solve() || contact.ignore) {
                    continue;
                }
                const a = contact.body1.maxParent;
                const b = contact.body2.maxParent;
                const a_body = a.global.body;
                const b_body = b.global.body;
                contact.applyForces();

                tmpVec1.setXYZ(1 - a_body.linearDamping.x, 1 - a_body.linearDamping.y, 1 - a_body.linearDamping.z);

                tmpVec2.setXYZ(1 - b_body.linearDamping.x, 1 - b_body.linearDamping.y, 1 - b_body.linearDamping.z);

                const v1 = contact.body1_netForce.scale(a.getEffectiveTotalInverseMass(contact.normal)).multiplyInPlace(tmpVec1);
                const a1 = a_body.inverseMomentOfInertia.multiplyVector3(contact.body1_netTorque).scaleInPlace(1 - a_body.angularDamping);
                const v2 = contact.body2_netForce.scale(b.getEffectiveTotalInverseMass(contact.normal)).multiplyInPlace(tmpVec2);
                const a2 = b_body.inverseMomentOfInertia.multiplyVector3(contact.body2_netTorque).scaleInPlace(1 - b_body.angularDamping);

                a.addVelocityAndAngularVelocity(v1, a1);
                b.addVelocityAndAngularVelocity(v2, a2);
            }
        }
        for (var iter = 0; iter < this.penetrationIterations; iter++) {
            for (const contact of this.contacts) {
                if (contact.ignore) {
                    continue;
                }
                contact.iteratePenetration();
            }
        }
        for (const mp of this.maxParents) {
            mp.translate(mp.translation);
        }

        for (const contact of this.contacts) {
            if (contact.ignore) {
                continue;
            }
            contact.body1.contacts.length = 0;
            contact.body2.contacts.length = 0;
        }

        for (const contact of this.contacts) {
            if (contact.constructor.name == "COLLISIONCONTACT") {
                contact.body1.dispatchEvent("collision", [contact]);
                contact.body2.dispatchEvent("collision", [contact]);
            }
            if (contact.ignore) {
                continue;
            }
            contact.body1.contacts.push(contact.body2.id);
            contact.body2.contacts.push(contact.body1.id);

        }

        this.contacts.length = 0;
        this.maxParents.clear();
    }

    /**
     * 
     * @param {Vector3} v 
     * @param {Hitbox3} aabb 
     * @returns 
     */
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

    /**
     * 
     * @param {Vector3} v 
     * @param {Hitbox3} aabb 
     * @param {Vector3} clamped 
     * @returns {Vector3}
     */
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

    /**
     * 
     * @param {Vector3} p 
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} c 
     * @returns {Vector3}
     */
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

    /**
     * 
     * @param {Vector3} orig 
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} c 
     * @returns {number | null}
     */
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


    gjk(shape1, shape2, t1, t2) {

        const GJK_MAX_ITERATIONS = 128;

        let dir = shape1.global.body.position.add(t1).subtract(shape2.global.body.position.add(t2));
        if (dir.isZero()) {
            dir = new Vector3(1, 0, 0);
        }
        let simplex = [];
        let a;

        simplex[0] = this.getMinkowskiSupport(shape1, shape2, t1, t2, dir);

        dir = simplex[0].p.scale(-1);

        for (var i = 0; i < GJK_MAX_ITERATIONS; i++) {
            a = this.getMinkowskiSupport(shape1, shape2, t1, t2, dir);
            if (a.p.dot(dir) < 0) {
                return false;
            }
            simplex.push(a);
            if (this.updateSimplex(dir, simplex)) {
                return simplex;
            }
        }

        return false;
    }


    /**
     * 
     * @param {Vector3} direction 
     * @param {Array.<Vector3>} points 
     */

    updateSimplex(direction, points) {
        if (points.length == 2) {
            const A = points[1].p;
            const B = points[0].p;
            const AB = B.subtract(A);
            const AO = A.scale(-1);
            direction.set(AB.cross(AO).cross(AB));
            if (direction.isZero()) {
                direction.set(AB.cross(new Vector3(1, 0, 0)));
                if (direction.isZero()) {
                    direction.set(AB.cross(new Vector3(0, 0, -1)));
                }
            }
        }
        else if (points.length == 3) {
            const A = points[2].p;
            const B = points[1].p;
            const C = points[0].p;
            const AB = B.subtract(A);
            const AC = C.subtract(A);
            const AO = A.scale(-1);
            const ABC = AB.cross(AC);

            if (AB.cross(ABC).dot(AO) > 0) {
                points[0] = points.pop();
                direction.set(AB.cross(AO).cross(AB));
                return false;
            }

            if (ABC.cross(AC).dot(AO) > 0) {
                points[1] = points.pop();
                direction.set(AC.cross(AO).cross(AC));
            }

            if (ABC.dot(AO) > 0) {
                direction.set(ABC);
                return false;
            }
            var temp = points[0];
            points[0] = points[1];
            points[1] = temp;
            direction.set(ABC.scaleInPlace(-1));
            return false;
        }
        else if (points.length == 4) {
            const A = points[3].p;
            const B = points[2].p;
            const C = points[1].p;
            const D = points[0].p;

            const AO = A.scale(-1);
            const AB = B.subtract(A);
            const AC = C.subtract(A);
            const AD = D.subtract(A);

            const ABC = AB.cross(AC);
            const ACD = AC.cross(AD);
            const ADB = AD.cross(AB);

            if (ABC.dot(AO) > 0) {
                points.shift();
                direction.set(ABC);
                return false;
            }

            if (ACD.dot(AO) > 0) {
                points[2] = points.pop();
                direction.set(ACD);
                return false;
            }

            if (ADB.dot(AO) > 0) {
                points[1] = points[2];
                points[2] = points.pop();
                direction.set(ADB);
                return false;
            }

            return true;

        }
    }


    /**
     * 
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} c 
     * @param {Vector3} p 
     * @returns {Array.<number>}
     */
    barycenter(a, b, c, p) {
        let v0 = b.subtract(a);
        let v1 = c.subtract(a);
        let v2 = p.subtract(a);
        let d00 = v0.dot(v0);
        let d01 = v0.dot(v1);
        let d11 = v1.dot(v1);
        let d20 = v2.dot(v0);
        let d21 = v2.dot(v1);
        let denom = d00 * d11 - d01 * d01;

        let v = (d11 * d20 - d01 * d21) / denom;
        let w = (d00 * d21 - d01 * d20) / denom;
        let u = 1 - v - w;
        return [u, v, w];
    }

    epa(simplex, shape1, shape2, t1, t2) {
        const faces = [];

        let a = simplex[3];
        let b = simplex[2];
        let c = simplex[1];
        let d = simplex[0];

        faces.push([a, b, c, { p: b.p.subtract(a.p).cross(c.p.subtract(a.p)).normalizeInPlace() }]);
        faces.push([a, c, d, { p: c.p.subtract(a.p).cross(d.p.subtract(a.p)).normalizeInPlace() }]);
        faces.push([a, d, b, { p: d.p.subtract(a.p).cross(b.p.subtract(a.p)).normalizeInPlace() }]);
        faces.push([b, d, c, { p: d.p.subtract(b.p).cross(c.p.subtract(b.p)).normalizeInPlace() }]);

        let closestFace;

        for (let i = 0; i < this.constructor.EPA_MAX_ITERATIONS; i++) {
            let minDistance = faces[0][0].p.dot(faces[0][3].p);
            closestFace = 0;
            for (let j = 1; j < faces.length; j++) {
                const distance = faces[j][0].p.dot(faces[j][3].p);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestFace = j;
                }
            }

            let direction = faces[closestFace][3].p;
            let p = this.getMinkowskiSupport(shape1, shape2, t1, t2, direction);



            if (p.p.dot(direction) - minDistance < 0.0001) {
                let closestPlane = {
                    normal: faces[closestFace][1].p.subtract(faces[closestFace][0].p).cross(faces[closestFace][2].p.subtract(faces[closestFace][0].p)).normalize(),
                    distance: null
                };

                closestPlane.distance = -closestPlane.normal.dot(faces[closestFace][0].p);

                let projectionPoint = closestPlane.normal.scale(-closestPlane.distance);
                let bary = this.barycenter(faces[closestFace][0].p, faces[closestFace][1].p, faces[closestFace][2].p, projectionPoint);
                let localA = faces[closestFace][0].a.scale(bary[0]).addInPlace(faces[closestFace][1].a.scale(bary[1])).addInPlace(faces[closestFace][2].a.scale(bary[2]));
                let localB = faces[closestFace][0].b.scale(bary[0]).addInPlace(faces[closestFace][1].b.scale(bary[1])).addInPlace(faces[closestFace][2].b.scale(bary[2]));

                let normal = localA.subtract(localB).normalizeInPlace();
                const contacts = [
                    [localA, localB],
                    // [faces[closestFace][0].a, faces[closestFace][0].b],
                    // [faces[closestFace][1].a, faces[closestFace][1].b],
                    // [faces[closestFace][2].a, faces[closestFace][2].b]
                ];
                return {
                    contacts: contacts,
                    normal: normal
                };
            }

            let looseEdges = [];
            for (let j = 0; j < faces.length; j++) {
                if (faces[j][3].p.dot(p.p.subtract(faces[j][0].p)) > 0) {
                    for (let k = 0; k < 3; k++) {
                        let currentEdge = [faces[j][k], faces[j][(k + 1) % 3]];
                        let found = false;
                        for (let l = 0; l < looseEdges.length; l++) {
                            if (looseEdges[l][1].p.equals(currentEdge[0].p) && looseEdges[l][0].p.equals(currentEdge[1].p)) {
                                found = true;
                                looseEdges[l] = looseEdges[looseEdges.length - 1]
                                looseEdges.length--;
                                break;
                            }
                        }
                        if (!found) {
                            if (looseEdges.length > 32) {
                                break;
                            }
                            looseEdges.push(currentEdge);
                        }
                    }
                    faces[j] = faces[faces.length - 1];
                    faces.length--;
                    j--;
                }
            }

            for (let j = 0; j < looseEdges.length; j++) {
                if (faces.length >= this.constructor.EPA_MAX_ITERATIONS) {
                    break;
                }
                faces.push([
                    looseEdges[j][0],
                    looseEdges[j][1],
                    p,
                    {
                        p: looseEdges[j][0].p.subtract(looseEdges[j][1].p).cross(looseEdges[j][0].p.subtract(p.p)).normalizeInPlace()
                    }
                ]);


                if (faces[faces.length - 1][3].p.dot(faces[faces.length - 1][0].p) < -0.0001) {
                    let temp = faces[faces.length - 1][0];
                    faces[faces.length - 1][0] = faces[faces.length - 1][1];
                    faces[faces.length - 1][1] = temp;
                    faces[faces.length - 1][3].p.scaleInPlace(-1);
                }

            }
        }

        return null;
    }

    findClosestFace(points, faces) {
        let minDistance = Infinity;
        let closestFace = null;
        let closestNormal = null;
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            let v1 = points[face[0]].p;
            let normal = face[3].p;
            if (normal.dot(v1) > 0) {
                normal.scaleInPlace(-1);
                let temp = face[0];
                face[0] = face[1];
                face[1] = temp;
                v1 = points[face[0]].p;
            }
            const distance = Math.abs(v1.dot(normal));
            if (distance < minDistance) {
                minDistance = distance;
                closestFace = face;
                closestNormal = normal;
            }
        }
        return {
            face: closestFace,
            normal: closestNormal,
            distance: minDistance
        };
    }

    getMinkowskiSupport(shape1, shape2, t1, t2, direction) {
        const pA = shape1.supportFunction(direction.scale(-1)).addInPlace(t1);
        const pB = shape2.supportFunction(direction).addInPlace(t2);
        return {
            a: pA,
            b: pB,
            p: pB.subtract(pA)
        }
    }

    /**
     * 
     * @param {Vector3} min1 
     * @param {Vector3} max1 
     * @param {Vector3} min2 
     * @param {Vector3} max2 
     * @param {Vector3} relVel 
     * @returns {array}
     */
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

    /**
     * 
     * @param {Hitbox3} aabb1
     * @param {Vector3} vel1
     * @param {Hitbox3} aabb2
     * @param {Vector3} vel2
     * @returns {array | null}
     */

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


    /**
     * 
     * @param {Composite} shape1 
     * @param {Composite} shape2 
     * @returns {[number, number]}
     */
    getMinMaxTime(shape1, shape2) {
        var minT = 0;
        var maxT = 1;
        var timeOfImpact = this.timeOfImpactAABBAABB(shape1.global.hitbox.translate(shape1.global.body.getVelocity().scale(-1)), shape1.global.body.getVelocity(), shape2.global.hitbox.translate(shape2.global.body.getVelocity().scale(-1)), shape2.global.body.getVelocity());
        if (timeOfImpact != null) {
            return [Math.min(1, Math.max(0, timeOfImpact[0])), Math.min(1, Math.max(0, timeOfImpact[1]))];
        }
        return [minT, maxT];
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
                    contact.normal = t.getNormal();
                    if (contact.penetration <= 0) {
                        continue;
                    }

                    if (contact.normal.isZero()) {
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