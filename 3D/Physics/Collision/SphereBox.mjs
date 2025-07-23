import CollisionContact from "./CollisionContact.mjs";
import Vector3 from "../Math3D/Vector3.mjs";

class SphereBox {
    static handle(collisionDetector, sphere, box, minT, maxT) {

        let spherePos = null;
        let closestPoint = null;
        let inside = false;
        let t1;
        let t2;
        var t = maxT;
        for (var i = -1; i < collisionDetector.binarySearchDepth; i++) {
            t = (i == collisionDetector.binarySearchDepth - 1) ? maxT : minT + (maxT - minT) * 0.333333;


            spherePos = sphere.global.body.previousPosition.lerp(sphere.global.body.position, t);
            let boxPos = box.global.body.previousPosition.lerp(box.global.body.position, t);
            t1 = spherePos.subtract(sphere.global.body.position);
            t2 = boxPos.subtract(box.global.body.position);
            let relativePos = box.global.body.rotation.conjugate().multiplyVector3(spherePos.subtract(boxPos));
            closestPoint = null;
            inside = false;

            const clampedPoint = collisionDetector.clampPointToAABB(relativePos, box);
            inside = clampedPoint.equals(relativePos);
            if (inside) {
                closestPoint = collisionDetector.closestPointToAABB(relativePos, box, clampedPoint);
            }
            else {
                closestPoint = clampedPoint;
            }
            const minDistanceSquared = closestPoint.subtract(relativePos).magnitudeSquared();


            let result = (inside ? -1 : 1) * (minDistanceSquared - (inside ? -1 : 1) * sphere.radius * sphere.radius);
            if (result > 0) {
                minT = t;
                if (i == collisionDetector.binarySearchDepth - 1) {
                    return false;
                }
            } else {
                maxT = t;
            }
        }

        const contact = new CollisionContact();

        contact.pointB = box.translateLocalToWorld(closestPoint).subtract(t2);
        contact.normal = spherePos.subtract(contact.pointB.add(t2)).normalizeInPlace();
        if (contact.normal.isZero()) {
            contact.normal = new Vector3(1, 0, 0);
        }

        if (inside) {
            contact.normal.scaleInPlace(-1);
        }
        contact.pointA = sphere.global.body.position.add(contact.normal.scale(-sphere.radius));
        contact.body1 = sphere;
        contact.body2 = box;
        collisionDetector.addContact(contact);

        return true;
    }
}

export default SphereBox