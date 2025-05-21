import Vector3 from "../Math3D/Vector3.mjs";

const Hitbox3 = class {
    constructor(min = new Vector3(), max = new Vector3()) {
        this.min = min;
        this.max = max;
    }

    copy() {
        var hitbox = new this.constructor();
        hitbox.min = this.min.copy();
        hitbox.max = this.max.copy();
        return hitbox;
    }

    equals(h2) {
        return this.min.equals(h2.min) && this.max.equals(h2.max);
    }

    extend(v){
        var hitbox = new this.constructor();
        hitbox.min = this.min.subtract(v)
        hitbox.max = this.max.add(v);
        return hitbox;
    }

    expandToFitPoint(v) {
        this.min.x = Math.min(this.min.x, v.x);
        this.min.y = Math.min(this.min.y, v.y);
        this.min.z = Math.min(this.min.z, v.z);
        this.max.x = Math.max(this.max.x, v.x);
        this.max.y = Math.max(this.max.y, v.y);
        this.max.z = Math.max(this.max.z, v.z);
        return this;
    }

    reorder() {
        var temp = 0;
        if (this.min.x > this.max.x) {
            temp = this.min.x;
            this.min.x = this.max.x;
            this.max.x = temp;
        }
        if (this.min.y > this.max.y) {
            temp = this.min.y;
            this.min.y = this.max.y;
            this.max.y = temp;
        }
        if (this.min.z > this.max.z) {
            temp = this.min.z;
            this.min.z = this.max.z;
            this.max.z = temp;
        }
        return this;
    }

    intersects(h2) {
        if (this.min.x >= h2.max.x || this.max.x <= h2.min.x) {
            return false;
        }
        if (this.min.y >= h2.max.y || this.max.y <= h2.min.y) {
            return false;
        }
        if (this.min.z >= h2.max.z || this.max.z <= h2.min.z) {
            return false;
        }
        return true;
    }

    containsPoint(v) {
        if (v.x >= this.min.x && v.x <= this.max.x && v.y >= this.min.y && v.y <= this.max.y && v.z >= this.min.z && v.z <= this.max.z) {
            return true;
        }
        return false;
    }

    contains(h2) {
        if (h2.min.x >= this.min.x && h2.min.y >= this.min.y && h2.max.x <= this.max.x && h2.max.y <= this.max.y && h2.min.z >= this.min.z && h2.max.z <= this.max.z) {
            return true;
        }
        return false;
    }

    getRadius() {
        return this.min.distance(this.max) * 0.5;
    }

    getCenter() {
        return this.min.add(this.max).scale(0.5);
    }

    getRadiusSquared() {
        return this.min.distanceSquared(this.max) * 0.25;
    }

    translate(v){
        return new this.constructor(this.min.add(v), this.max.add(v));
    }

    toJSON() {
        return {
            min: this.min.toJSON(),
            max: this.max.toJSON()
        }
    }

    static from(options) {
        var hitbox = new this();
        hitbox.min = Vector3.from(options?.min);
        hitbox.max = Vector3.from(options?.max);
        return hitbox;
    }

    static fromVectors(vectors) {
        var hitbox = new this();
        hitbox.min = new Vector3(Infinity, Infinity, Infinity);
        hitbox.max = new Vector3(-Infinity, -Infinity, -Infinity);
        for (var v of vectors) {
            hitbox.expandToFitPoint(v);
        }
        return hitbox;
    }

    static fromHitboxes(hitboxes) {
        var hitbox = new this();
        hitbox.min = new Vector3(Infinity, Infinity, Infinity);
        hitbox.max = new Vector3(-Infinity, -Infinity, -Infinity);
        for (var h of hitboxes) {
            hitbox.expandToFitPoint(h.min);
            hitbox.expandToFitPoint(h.max);
        }
        return hitbox;
    }

    static fromJSON(jsondata) {
        var hitbox = new this();
        hitbox.min = Vector3.fromJSON(jsondata.min);
        hitbox.max = Vector3.fromJSON(jsondata.max);
        return hitbox;
    }
};


export default Hitbox3;