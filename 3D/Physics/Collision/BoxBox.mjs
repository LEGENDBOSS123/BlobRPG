import CollisionContact from "./CollisionContact.mjs";
import Vector3 from "../Math3D/Vector3.mjs";

class BoxBox {
    // static handle(collisionDetector, box1, box2, minT, maxT) {
    //     let t1;
    //     let t2;
    //     let simplex;


    //     var t = maxT;
    //     for (var i = -1; i < collisionDetector.GJKBinarySearchDepth; i++) {
    //         t = (i == collisionDetector.GJKBinarySearchDepth - 1) ? maxT : minT + (maxT - minT) * 0.333333;
    //         let box1Pos = box1.global.body.previousPosition.lerp(box1.global.body.position, t);
    //         let box2Pos = box2.global.body.previousPosition.lerp(box2.global.body.position, t);

    //         t1 = box1Pos.subtract(box1.global.body.position);
    //         t2 = box2Pos.subtract(box2.global.body.position);

    //         simplex = collisionDetector.gjk(box1, box2, t1, t2);

    //         let result = 1;
    //         if (simplex) {
    //             result = -1;
    //         }

    //         if (result > 0) {
    //             minT = t;
    //             if (i == collisionDetector.GJKBinarySearchDepth - 1) {
    //                 return false;
    //             }
    //         } else {
    //             maxT = t;
    //         }
    //     }


    //     if (!simplex) {
    //         return false;
    //     }
    //     const contacts = collisionDetector.epa(simplex, box1, box2, t1, t2);
    //     if (!contacts) {
    //         return false;
    //     }
    //     for (const contact of contacts.contacts) {
    //         const c = new CollisionContact();
    //         c.pointA = contact[0].copy();
    //         c.pointB = contact[1].copy();
    //         c.normal = contacts.normal.scale(-1);
    //         if (c.normal.isZero()) {
    //             c.normal = new Vector3(1, 0, 0);
    //         }
    //         c.body1 = box1;
    //         c.body2 = box2;
    //         collisionDetector.addContact(c);
    //     }
    //     return true;
    // }


    // static handle(collisionDetector, box1, box2, minT, maxT) {

    //     var t = maxT;
    //     let contactsAdded = 0;
    //     for (var i = -1; i < collisionDetector.GJKBinarySearchDepth; i++) {
    //         t = (i == collisionDetector.GJKBinarySearchDepth - 1) ? maxT : minT + (maxT - minT) * 0.333333;

    //         let globalInside = false;
    //         let breakOut = false;
    //         let box1Pos = box1.global.body.previousPosition.lerp(box1.global.body.position, t);
    //         let box2Pos = box2.global.body.previousPosition.lerp(box2.global.body.position, t);
    //         for (var x = -0.5; x <= 0.5; x += 1) {
    //             for (var y = -0.5; y <= 0.5; y += 1) {
    //                 for (var z = -0.5; z <= 0.5; z += 1) {
    //                     let vec = box1.global.body.rotation.multiplyVector3(new Vector3(x * box1.width, y * box1.height, z * box1.depth)).addInPlace(box1Pos);
    //                     const relativePoint = box2.global.body.rotation.conjugate().multiplyVector3(vec.subtract(box2Pos));
    //                     const clampedPoint = collisionDetector.clampPointToAABB(relativePoint, box2);
    //                     let inside = clampedPoint.equals(relativePoint);
    //                     if (inside) {

    //                         globalInside = true;
    //                         if (i == collisionDetector.GJKBinarySearchDepth - 1) {
    //                             let closestPoint = collisionDetector.closestPointToAABB(relativePoint, box2, clampedPoint);
    //                             const contact = new CollisionContact();
    //                             contact.body1 = box1;
    //                             contact.body2 = box2;
    //                             contact.pointA = vec;
    //                             contact.pointB = box2.translateLocalToWorld(closestPoint);
    //                             contact.normal = contact.pointB.subtract(contact.pointA).normalizeInPlace();
    //                             if (contact.normal.isZero()) {
    //                                 contact.normal = new Vector3(1, 0, 0);
    //                             }
    //                             collisionDetector.addContact(contact);
    //                             contactsAdded++;
    //                         }
    //                         else {
    //                             breakOut = true;
    //                             break;
    //                         }
    //                     }
    //                     if (breakOut) {
    //                         break;
    //                     }
    //                 }
    //                 if (breakOut) {
    //                     break;
    //                 }
    //             }
    //         }
    //         if (!breakOut) {
    //             for (var x = -0.5; x <= 0.5; x += 1) {
    //                 for (var y = -0.5; y <= 0.5; y += 1) {
    //                     for (var z = -0.5; z <= 0.5; z += 1) {
    //                         let vec = box2.global.body.rotation.multiplyVector3(new Vector3(x * box2.width, y * box2.height, z * box2.depth)).addInPlace(box2Pos);
    //                         const relativePoint = box1.global.body.rotation.conjugate().multiplyVector3(vec.subtract(box1Pos));
    //                         const clampedPoint = collisionDetector.clampPointToAABB(relativePoint, box1);
    //                         let inside = clampedPoint.equals(relativePoint);

    //                         if (inside) {
    //                             globalInside = true;


    //                             if (i == collisionDetector.GJKBinarySearchDepth - 1) {
    //                                 let closestPoint = collisionDetector.closestPointToAABB(relativePoint, box1, clampedPoint);
    //                                 const contact = new CollisionContact();
    //                                 contact.body1 = box1;
    //                                 contact.body2 = box2;
    //                                 contact.pointA = box1.translateLocalToWorld(closestPoint);
    //                                 contact.pointB = vec;
    //                                 contact.normal = contact.pointB.subtract(contact.pointA).normalizeInPlace();
    //                                 if (contact.normal.isZero()) {
    //                                     contact.normal = new Vector3(1, 0, 0);
    //                                 }
    //                                 collisionDetector.addContact(contact);
    //                                 contactsAdded++;
    //                             }
    //                             else {
    //                                 breakOut = true;
    //                                 break;
    //                             }
    //                         }
    //                     }
    //                     if (breakOut) {
    //                         break;
    //                     }
    //                 }
    //                 if (breakOut) {
    //                     break;
    //                 }
    //             }
    //         }
    //         if ((i == collisionDetector.GJKBinarySearchDepth - 1 || !breakOut) && contactsAdded < 5) {
    //             let t1 = box1Pos.subtract(box1.global.body.position);
    //             let t2 = box2Pos.subtract(box2.global.body.position);
    //             let simplex = collisionDetector.gjk(box1, box2, t1, t2);
    //             if (simplex) {
    //                 globalInside = true;
    //                 const epa = collisionDetector.epa(simplex, box1, box2, t1, t2);
    //                 if (epa && i == collisionDetector.GJKBinarySearchDepth - 1) {

    //                     for (const contact of epa.contacts) {
    //                         const c = new CollisionContact();
    //                         c.body1 = box1;
    //                         c.body2 = box2;
    //                         c.pointA = contact[0];
    //                         c.pointB = contact[1];
    //                         c.normal = epa.normal.scale(-1);
    //                         if (c.normal.isZero()) {
    //                             c.normal = new Vector3(1, 0, 0);
    //                         }
    //                         collisionDetector.addContact(c);
    //                     }
    //                 }
    //             }

    //         }




    //         let result = 1;
    //         if (globalInside) {
    //             result = -1;
    //         }




    //         if (result > 0) {
    //             minT = t;
    //             if (i == collisionDetector.GJKBinarySearchDepth - 1) {
    //                 return false;
    //             }
    //         } else {
    //             maxT = t;
    //         }
    //     }

    //     return true;
    // }

    isPointPenetrating() { }


    static getContactPointsFaceFace(collisionDetector, axes, box1, box2, t1, t2, normal, overlap, type) {
        const points = [];

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    let box1Vert = axes[0].scale(x).addInPlace(axes[1].scale(y)).addInPlace(axes[2].scale(z)).addInPlace(box1.global.body.position.add(t1));

                    let relativeVert = box2.global.body.rotation.conjugate().multiplyVector3(box1Vert.subtract(box2.global.body.position.add(t2)));

                    const clampedVert = collisionDetector.clampPointToAABB(relativeVert, box2);
                    let inside = clampedVert.equals(relativeVert);
                    if (inside) {
                        let closestVert = collisionDetector.closestPointToAABB(relativeVert, box2, clampedVert);
                        points.push([box1Vert, box2.translateLocalToWorld(closestVert)]);
                    }
                }
            }
        }

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    let box2Vert = axes[3].scale(x).addInPlace(axes[4].scale(y)).addInPlace(axes[5].scale(z)).addInPlace(box2.global.body.position.add(t2));

                    let relativeVert = box1.global.body.rotation.conjugate().multiplyVector3(box2Vert.subtract(box1.global.body.position.add(t1)));

                    const clampedVert = collisionDetector.clampPointToAABB(relativeVert, box1);
                    let inside = clampedVert.equals(relativeVert);
                    if (inside) {
                        let closestVert = collisionDetector.closestPointToAABB(relativeVert, box1, clampedVert);
                        points.push([box1.translateLocalToWorld(closestVert), box2Vert]);
                    }
                }
            }
        }
        return points;
    }

    static getContactPoints(collisionDetector, axes, box1, box2, t1, t2, normal, overlap, type) {
        if (type == this.FACE) {
            return this.getContactPointsFaceFace(collisionDetector, axes, box1, box2, t1, t2, normal, overlap, type);
        }

        const points = [];
        const TOLERANCE = 0.0001;

        if (overlap) {

        }

    }

    static FACE = 0;
    static EDGE = 0;

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

        for (var i = -1; i < collisionDetector.GJKBinarySearchDepth; i++) {
            t = (i == collisionDetector.GJKBinarySearchDepth - 1) ? maxT : minT + (maxT - minT) * 0.333333;

            let globalInside = true;
            let minOverlap = Infinity;
            let normal = null;
            let contactType = this.EDGE;
            let box1Pos = box1.global.body.previousPosition.lerp(box1.global.body.position, t);
            let box2Pos = box2.global.body.previousPosition.lerp(box2.global.body.position, t);

            let t1 = box1Pos.subtract(box1.global.body.position);
            let t2 = box2Pos.subtract(box2.global.body.position);
            let relative = box1Pos.subtract(box2Pos);
            for (let i = 0; i < testAxes.length; i++) {
                const axis = testAxes[i];
                const min1 = axis.dot(box1.supportFunction(axis.scale(-1)).addInPlace(t1));
                const max1 = axis.dot(box1.supportFunction(axis).addInPlace(t1));
                const min2 = axis.dot(box2.supportFunction(axis.scale(-1)).addInPlace(t2));
                const max2 = axis.dot(box2.supportFunction(axis).addInPlace(t2));

                if (max1 >= min2 && max2 >= min1) {
                    const overlap = Math.min(max1, max2) - Math.max(min1, min2);
                    if (overlap < minOverlap) {
                        minOverlap = overlap;
                        normal = axis;
                        if (i < 6) {
                            contactType = this.FACE;
                        }
                        else {
                            contactType = this.EDGE;
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

                const points = this.getContactPoints(collisionDetector, testAxes, box1, box2, t1, t2, normal, minOverlap, contactType);
                for (const p of points) {
                    const contact = new CollisionContact();
                    contact.body1 = box1;
                    contact.body2 = box2;
                    contact.pointA = p[0];
                    contact.pointB = p[1];
                    contact.normal = normal;
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