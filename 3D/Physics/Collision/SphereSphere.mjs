import CollisionContact from "./CollisionContact.mjs";
import Vector3 from "../Math3D/Vector3.mjs";
class SphereSphere {
    static handle(collisionDetector, sphere1, sphere2, minT, maxT) {
        let sphere1Pos = null;
        let sphere2Pos = null;
        let t = 1;
        for (var i = -1; i < collisionDetector.binarySearchDepth; i++) {
            t = (i == collisionDetector.binarySearchDepth - 1) ? maxT : minT + (maxT - minT) * 0.333333;

            sphere1Pos = sphere1.global.body.previousPosition.lerp(sphere1.global.body.position, t);
            sphere2Pos = sphere2.global.body.previousPosition.lerp(sphere2.global.body.position, t);
            const distanceSquared = sphere1Pos.subtract(sphere2Pos).magnitudeSquared();

            var result = distanceSquared - (sphere1.radius + sphere2.radius) * (sphere1.radius + sphere2.radius);

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
        contact.normal = sphere1Pos.subtract(sphere2Pos).normalizeInPlace();
        if (contact.normal.isZero()) {
            contact.normal.setXYZ(1, 0, 0);
        }
        contact.pointA = sphere1.global.body.position.add(contact.normal.scale(-sphere1.radius));
        contact.pointB = sphere2.global.body.position.add(contact.normal.scale(sphere2.radius));

        contact.body1 = sphere1;
        contact.body2 = sphere2;

        collisionDetector.addContact(contact);
        return;
    }
}
export default SphereSphere;