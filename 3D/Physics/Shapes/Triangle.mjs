import Vector3 from "../Math3D/Vector3.mjs";
import Hitbox3 from "../Broadphase/Hitbox3.mjs";

const Triangle = class {
    constructor(a = new Vector3(), b = new Vector3(), c = new Vector3()) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    getNormal() {
        var v1 = this.b.subtract(this.a);
        var v2 = this.c.subtract(this.a);
        return v1.cross(v2).normalizeInPlace();
    }

    getCentroid() {
        return this.a.add(this.b).add(this.c).scaleInPlace(1 / 3);
    }

    getArea() {
        var v1 = this.b.subtract(this.a);
        var v2 = this.c.subtract(this.a);
        return v1.cross(v2).magnitude() / 2;
    }

    makeHitbox() {
        return Hitbox3.fromVectors([this.a, this.b, this.c]);
    }

    makeBoundingSphere() {
        var centroid = this.getCentroid();
        var radius = Math.sqrt(Math.max(this.a.distanceSquared(centroid), this.b.distanceSquared(centroid), this.c.distanceSquared(centroid)));
        return {
            center: centroid,
            radius: radius
        };
    }

    containsPoint(v) {
        var v0 = this.c.subtract(this.a);
        var v1 = this.b.subtract(this.a);
        var v2 = v.subtract(this.a);

        var dot00 = v0.dot(v0);
        var dot01 = v0.dot(v1);
        var dot02 = v0.dot(v2);
        var dot11 = v1.dot(v1);
        var dot12 = v1.dot(v2);

        var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1);
    }

    getHeight(v) {
        var areaABC = Math.abs((this.a.x * (this.b.z - this.c.z) + this.b.x * (this.c.z - this.a.z) + this.c.x * (this.a.z - this.b.z)) / 2.0);
        var areaPBC = Math.abs((v.x * (this.b.z - this.c.z) + this.b.x * (this.c.z - v.z) + this.c.x * (v.z - this.b.z)) / 2.0);
        var areaPCA = Math.abs((this.a.x * (v.z - this.c.z) + v.x * (this.c.z - this.a.z) + this.c.x * (this.a.z - v.z)) / 2.0);
        var areaPAB = Math.abs((this.a.x * (this.b.z - v.z) + this.b.x * (v.z - this.a.z) + v.x * (this.a.z - this.b.z)) / 2.0);

        return new Vector3(v.x, (areaPBC * this.a.y + areaPCA * this.b.y + areaPAB * this.c.y) / areaABC, v.z);
    }

    getClosestPoint(point) {
        var ab = this.b.subtract(this.a);
        var ac = this.c.subtract(this.a);
        var ap = point.subtract(this.a);

        var d1 = ab.dot(ap);
        var d2 = ac.dot(ap);

        if (d1 <= 0 && d2 <= 0) return this.a;

        var bp = point.subtract(this.b);
        var d3 = ab.dot(bp);
        var d4 = ac.dot(bp);

        if (d3 >= 0 && d4 <= d3) return this.b;

        var cp = point.subtract(this.c);
        var d5 = ab.dot(cp);
        var d6 = ac.dot(cp);

        if (d6 >= 0 && d5 <= d6) return this.c;

        var vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            var v = d1 / (d1 - d3);
            return this.a.add(ab.scale(v));
        }

        var vb = d5 * d2 - d1 * d6;
        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            var w = d2 / (d2 - d6);
            return this.a.add(ac.scale(w));
        }

        var va = d3 * d6 - d5 * d4;
        if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
            const u = (d4 - d3) / ((d4 - d3) + (d5 - d6));
            return this.b.add(this.c.subtract(this.b).scale(u));
        }

        var denom = 1 / (va + vb + vc);
        var v = vb * denom;
        var w = vc * denom;
        return this.a.add(ab.scale(v)).add(ac.scale(w));
    }

    closestPointOnLineSegment(v1, v2, point) {
        var v12 = v2.subtract(v1);
        var v13 = point.subtract(v1);

        var t = v13.dot(v12) / v12.dot(v12);

        if (t < 0) {
            return v1;
        } else if (t > 1) {
            return v2;
        } else {
            return v1.add(v12.scale(t));
        }
    }

    intersectsSphere(position) {
        if (!this.containsPoint(position)) {
            var points = [this.closestPointOnLineSegment(this.a, this.b, position), this.closestPointOnLineSegment(this.b, this.c, position), this.closestPointOnLineSegment(this.a, this.c, position)];
            var distances = [points[0].distanceSquared(position), points[1].distanceSquared(position), points[2].distanceSquared(position)];
            var minIndex = 0;

            for (var i = 1; i < distances.length; i++) {
                if (distances[i] < distances[minIndex]) {
                    minIndex = i;
                }
            }
            return points[minIndex];
        }
        var normal = this.getNormal();
        var distance = this.a.subtract(position).projectOnto(normal);
        var planePoint = position.add(distance);
        return planePoint;
    };


    copy() {
        return new this.constructor(this.a, this.b, this.c);
    }

    static from(a, b, c) {
        return new this(a?.a ?? a[0] ?? a ?? 0,
            b?.b ?? b[1] ?? b ?? 0,
            c?.c ?? c[2] ?? c ?? 0);
    }
};


export default Triangle;