import Vector3 from "../Math3D/Vector3.mjs";
import CollisionContact from "./CollisionContact.mjs";

class SpherePolyhedron {
    static handle(collisionDetector, sphere, poly, minT, maxT) {
        let spherePos = null;
        let closestPoint = null;
        let minDistanceSquared = Infinity;
        let polyPos = null;
        let relativePos = null;
        let inside = 0;

        let closestNormal = null;
        let isInside = false;
        let tempVec = new Vector3(1, 1, 1).scale(sphere.radius);
        let min = new Vector3();
        let max = new Vector3();

        let t = 1;
        let depth = poly.isConvex ? collisionDetector.binarySearchDepth : collisionDetector.concavePolyhedronBinarySearchDepth;
        for (var i = -1; i < depth; i++) {
            t = (i == depth - 1) ? maxT : minT + (maxT - minT) * 0.333333;



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

                if (!poly.isConvex && collisionDetector.horizontalRayIntersectsTriangle(relativePos, a, b, c)) {
                    inside++;
                }
                var normal = poly.normals[face].copy();

                if (poly.isConvex && a.subtract(relativePos).dot(normal) < 0) {
                    isInside = false;
                }
                if ((!Number.isFinite(minDistanceSquared) || i != depth - 1) && !(min.x <= relativePos.x + tempVec.x && max.x >= relativePos.x - tempVec.x && min.y <= relativePos.y + tempVec.y && max.y >= relativePos.y - tempVec.y && min.z <= relativePos.z + tempVec.z && max.z >= relativePos.z - tempVec.z)) {
                    continue;
                }

                var closest = collisionDetector.closestPointOnTriangle(relativePos, a, b, c);
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

            let result;
            if (isInside) {
                result = -(minDistanceSquared + sphere.radius * sphere.radius);
            }
            else {
                result = minDistanceSquared - sphere.radius * sphere.radius;
            }


            if (result > 0) {
                minT = t;
                if (i == depth - 1) {
                    return false;
                }
            } else {
                maxT = t;
            }
        }
        t = maxT;

        if (!closestPoint) {
            return false;
        }

        const closestPoint2 = poly.global.body.rotation.multiplyVector3(closestPoint).addInPlace(polyPos);
        const contact = new CollisionContact();
        contact.pointB = poly.translateLocalToWorld(closestPoint);
        contact.normal = spherePos.subtract(closestPoint2).normalizeInPlace();
        if (contact.normal.isZero()) {
            contact.normal.setXYZ(1, 0, 0)
        }
        if (isInside) {
            contact.normal.scaleInPlace(-1);
        }
        contact.pointA = sphere.global.body.position.add(contact.normal.scale(-sphere.radius));

        contact.body1 = sphere;
        contact.body2 = poly;

        collisionDetector.addContact(contact);
        return true;

    }
}

export default SpherePolyhedron;