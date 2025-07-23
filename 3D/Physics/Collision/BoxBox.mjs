import CollisionContact from "./CollisionContact.mjs";
import Vector3 from "../Math3D/Vector3.mjs";

class BoxBox {

    static getContactPointsFaceFace(collisionDetector, axes, box1, box2, t1, t2, normal, overlap) {
        const points = [];

        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    let box1Vert = axes[0].scale(x).addInPlace(axes[1].scale(y)).addInPlace(axes[2].scale(z)).addInPlace(box1.global.body.position.add(t1));

                    let relativeVert = box2.global.body.rotation.conjugate().multiplyVector3(box1Vert.subtract(box2.global.body.position.add(t2)));

                    const clampedVert = collisionDetector.clampPointToAABB(relativeVert, box2);
                    let inside = clampedVert.equals(relativeVert);
                    if (inside) {
                        relativeVert.addInPlace(box2.global.body.rotation.conjugate().multiplyVector3(normal).scale(overlap));
                        let closestVert = collisionDetector.closestPointToAABB(relativeVert, box2);
                        points.push({ pointA: box1Vert, pointB: box2.translateLocalToWorld(closestVert) });
                    }

                }
            }
        }


        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    let box2Vert = axes[3].scale(x).addInPlace(axes[4].scale(y)).addInPlace(axes[5].scale(z)).addInPlace(box2.global.body.position.add(t2));

                    let relativeVert = box1.global.body.rotation.conjugate().multiplyVector3(box2Vert.subtract(box1.global.body.position.add(t1)));

                    const clampedVert = collisionDetector.clampPointToAABB(relativeVert, box1);
                    let inside = clampedVert.equals(relativeVert);
                    if (inside) {
                        relativeVert.addInPlace(box1.global.body.rotation.conjugate().multiplyVector3(normal).scale(-overlap));
                        let closestVert = collisionDetector.closestPointToAABB(relativeVert, box1);
                        points.push({ pointA: box1.translateLocalToWorld(closestVert), pointB: box2Vert });
                    }
                }
            }
        }
        return points;
    }


    static FACE = 0;
    static EDGE = 1;


    static handle(collisionDetector, box1, box2, minT, maxT) {


        var t = maxT;
        const halfWidth1 = box1.width * 0.5;
        const halfHeight1 = box1.height * 0.5;
        const halfDepth1 = box1.depth * 0.5;
        const halfWidth2 = box2.width * 0.5;
        const halfHeight2 = box2.height * 0.5;
        const halfDepth2 = box2.depth * 0.5;


        const box1axes = [];
        box1axes.push(box1.global.body.rotation.multiplyVector3(new Vector3(halfWidth1, 0, 0)));
        box1axes.push(box1.global.body.rotation.multiplyVector3(new Vector3(0, halfHeight1, 0)));
        box1axes.push(box1.global.body.rotation.multiplyVector3(new Vector3(0, 0, halfDepth1)));

        const box2axes = [];
        box2axes.push(box2.global.body.rotation.multiplyVector3(new Vector3(halfWidth2, 0, 0)));
        box2axes.push(box2.global.body.rotation.multiplyVector3(new Vector3(0, halfHeight2, 0)));
        box2axes.push(box2.global.body.rotation.multiplyVector3(new Vector3(0, 0, halfDepth2)));

        const testAxes = box1axes.concat(box2axes);

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const axis1 = box1axes[i];
                const axis2 = box2axes[j];
                const crossAxis = axis1.cross(axis2);
                if (crossAxis.magnitudeSquared() > 0.0000001) {
                    testAxes.push(crossAxis.normalizeInPlace());
                }
            }
        }
        let type = this.constructor.FACE;

        for (var i = -1; i < collisionDetector.GJKBinarySearchDepth; i++) {
            t = (i == collisionDetector.GJKBinarySearchDepth - 1) ? maxT : minT + (maxT - minT) * 0.5;

            let globalInside = true;
            let minOverlap = Infinity;
            let normal = null;
            let box1Pos = box1.global.body.previousPosition.lerp(box1.global.body.position, t);
            let box2Pos = box2.global.body.previousPosition.lerp(box2.global.body.position, t);

            let t1 = box1Pos.subtract(box1.global.body.position);
            let t2 = box2Pos.subtract(box2.global.body.position);
            let relative = box1Pos.subtract(box2Pos);
            for (let i = 0; i < testAxes.length; i++) {
                const axis = testAxes[i];
                const min1 = axis.dot(box1.supportFunction(axis.scale(-1)).add(t1));
                const max1 = axis.dot(box1.supportFunction(axis).add(t1));
                const min2 = axis.dot(box2.supportFunction(axis.scale(-1)).add(t2));
                const max2 = axis.dot(box2.supportFunction(axis).add(t2));

                if (max1 >= min2 && max2 >= min1) {
                    const overlap = Math.min(max1, max2) - Math.max(min1, min2);
                    if (overlap < minOverlap) {
                        minOverlap = overlap;
                        normal = axis;
                        if (i < 6) {
                            type = this.constructor.FACE
                        }
                        else {
                            type = this.constructor.EDGE
                        }
                        if (normal.dot(relative) < 0) {
                            normal.scaleInPlace(-1);
                        }
                    }
                }
                else {
                    globalInside = false;
                    break;
                }
            }

            if (i == collisionDetector.GJKBinarySearchDepth - 1) {
                if (!globalInside) {
                    return false;
                }
                let points = this.getContactPointsFaceFace(collisionDetector, testAxes, box1, box2, t1, t2, normal, minOverlap);
                for (const p of points) {
                    const contact = new CollisionContact();
                    contact.body1 = box1;
                    contact.body2 = box2;


                    contact.pointA = p.pointA.subtract(t1);
                    contact.pointB = p.pointB.subtract(t2);
                    contact.normal = normal.copy();
                    collisionDetector.addContact(contact);
                }

                return true;
            }

            let result = 1;
            if (globalInside) {
                result = -1;
            }

            if (result > 0) {
                minT = t;
            } else {
                maxT = t;
            }
        }

        return true;
    }
}

export default BoxBox;