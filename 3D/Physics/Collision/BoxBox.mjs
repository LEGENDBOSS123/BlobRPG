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

    static handle(collisionDetector, box1, box2, minT, maxT) {

        var t = maxT;
        for (var i = -1; i < collisionDetector.GJKBinarySearchDepth; i++) {
            t = (i == collisionDetector.GJKBinarySearchDepth - 1) ? maxT : minT + (maxT - minT) * 0.333333;

            let globalInside = false;
            let breakOut = false;
            let box1Pos = box1.global.body.previousPosition.lerp(box1.global.body.position, t);
            let box2Pos = box2.global.body.previousPosition.lerp(box2.global.body.position, t);
            for (var x = -0.5; x <= 0.5; x += 1) {
                for (var y = -0.5; y <= 0.5; y += 1) {
                    for (var z = -0.5; z <= 0.5; z += 1) {
                        let vec = box1.global.body.rotation.multiplyVector3(new Vector3(x * box1.width, y * box1.height, z * box1.depth)).addInPlace(box1Pos);
                        const relativePoint = box2.global.body.rotation.conjugate().multiplyVector3(vec.subtract(box2Pos));
                        const clampedPoint = collisionDetector.clampPointToAABB(relativePoint, box2);
                        let inside = clampedPoint.equals(relativePoint);
                        if (inside) {

                            globalInside = true;
                            if (i == collisionDetector.GJKBinarySearchDepth - 1) {
                                let closestPoint = collisionDetector.closestPointToAABB(relativePoint, box2, clampedPoint);
                                const contact = new CollisionContact();
                                contact.body1 = box1;
                                contact.body2 = box2;
                                contact.pointA = vec;
                                contact.pointB = box2.translateLocalToWorld(closestPoint);
                                contact.normal = vec.subtract(contact.pointB).normalizeInPlace().scaleInPlace(-1);
                                if (contact.normal.isZero()) {
                                    contact.normal = new Vector3(1, 0, 0);
                                }
                                collisionDetector.addContact(contact);
                            }
                            else {
                                breakOut = true;
                                break;
                            }
                        }
                        if (breakOut) {
                            break;
                        }
                    }
                    if (breakOut) {
                        break;
                    }
                }
            }
            if (!breakOut) {
                for (var x = -0.5; x <= 0.5; x += 1) {
                    for (var y = -0.5; y <= 0.5; y += 1) {
                        for (var z = -0.5; z <= 0.5; z += 1) {
                            let vec = box2.global.body.rotation.multiplyVector3(new Vector3(x * box2.width, y * box2.height, z * box2.depth)).addInPlace(box2Pos);
                            const relativePoint = box1.global.body.rotation.conjugate().multiplyVector3(vec.subtract(box1Pos));
                            const clampedPoint = collisionDetector.clampPointToAABB(relativePoint, box1);
                            let inside = clampedPoint.equals(relativePoint);
                            
                            if (inside) {
                                globalInside = true;


                                if (i == collisionDetector.GJKBinarySearchDepth - 1) {
                                    let closestPoint = collisionDetector.closestPointToAABB(relativePoint, box1, clampedPoint);
                                    const contact = new CollisionContact();
                                    contact.body1 = box2;
                                    contact.body2 = box1;
                                    contact.pointA = vec;
                                    contact.pointB = box1.translateLocalToWorld(closestPoint);
                                    contact.normal = vec.subtract(contact.pointB).normalizeInPlace().scaleInPlace(-1);
                                    if (contact.normal.isZero()) {
                                        contact.normal = new Vector3(1, 0, 0);
                                    }
                                    collisionDetector.addContact(contact);
                                }
                                else {
                                    breakOut = true;
                                    break;
                                }
                            }
                        }
                        if (breakOut) {
                            break;
                        }
                    }
                    if (breakOut) {
                        break;
                    }
                }
            }

            let result = 1;
            if (globalInside) {
                result = -1;
            }




            if (result > 0) {
                minT = t;
                if (i == collisionDetector.GJKBinarySearchDepth - 1) {
                    return false;
                }
            } else {
                maxT = t;
            }
        }

        return true;
    }
}

export default BoxBox;