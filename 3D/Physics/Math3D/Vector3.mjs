const Vector3 = class {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    equals(v) {
        return this.x == v.x && this.y == v.y && this.z == v.z;
    }

    clamp(min, max) {
        return new this.constructor(Math.max(min.x, Math.min(max.x, this.x)), Math.max(min.y, Math.min(max.y, this.y)), Math.max(min.z, Math.min(max.z, this.z)));
    }

    projectOnto(v) {
        return v.scale(this.dot(v) / v.magnitudeSquared());
    }

    projectOntoPlane(v) {
        return this.subtract(this.projectOnto(v));
    }

    abs(){
        return new this.constructor(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
    }

    cross(v) {
        return new this.constructor(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    angle(v) {
        return Math.acos(this.dot(v) / (this.magnitude() * v.magnitude()));
    }

    add(v) {
        return new this.constructor(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    subtract(v) {
        return new this.constructor(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    multiply(v) {
        return new this.constructor(this.x * v.x, this.y * v.y, this.z * v.z);
    }

    divide(v) {
        return new this.constructor(this.x / v.x, this.y / v.y, this.z / v.z);
    }

    addInPlace(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    subtractInPlace(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    multiplyInPlace(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }

    divideInPlace(v) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;
        return this;
    }

    scale(s) {
        return new this.constructor(this.x * s, this.y * s, this.z * s);
    }

    scaleInPlace(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    applyAxisAngle(axis, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return this.scale(cos).add(axis.cross(this).scale(sin)).add(axis.scale(axis.dot(this) * (1 - cos)));
    }

    rotateY(angle, sin = Math.sin(angle), cos = Math.cos(angle)) {
        return new this.constructor(this.x * cos - this.z * sin, this.y, this.x * sin + this.z * cos);
    }

    rotateX(angle, sin = Math.sin(angle), cos = Math.cos(angle)) {
        return new this.constructor(this.x, this.y * cos - this.z * sin, this.y * sin + this.z * cos);
    }

    rotateZ(angle, sin = Math.sin(angle), cos = Math.cos(angle)) {
        return new this.constructor(this.x * cos - this.y * sin, this.x * sin + this.y * cos, this.z);
    }

    rotate(v, order = "XYZ", sin = v.map(Math.sin), cos = v.map(Math.cos)) {
        var vector = this.copy();
        for (var i = 0; i < order.length; i++) {
            switch (order[i]) {
                case "X":
                    vector = vector.rotateXInPlace(v.x, sin.x, cos.x);
                    break;
                case "Y":
                    vector = vector.rotateYInPlace(v.y, sin.y, cos.y);
                    break;
                case "Z":
                    vector = vector.rotateZInPlace(v.z, sin.z, cos.z);
                    break;
            }
        }
        return vector;
    }


    rotateYInPlace(angle, sin = Math.sin(angle), cos = Math.cos(angle)) {
        const prevX = this.x;
        this.x = this.x * cos - this.z * sin;
        this.z = prevX * sin + this.z * cos;
        return this;
    }

    rotateXInPlace(angle, sin = Math.sin(angle), cos = Math.cos(angle)) {
        const prevY = this.y;
        this.y = this.y * cos - this.z * sin;
        this.z = prevY * sin + this.z * cos;
        return this;
    }

    rotateZInPlace(angle, sin = Math.sin(angle), cos = Math.cos(angle)) {
        const prevX = this.x;
        this.x = this.x * cos - this.y * sin;
        this.y = prevX * sin + this.y * cos;
        return this;
    }

    rotateInPlace(v, order = "XYZ", sin = v.map(Math.sin), cos = v.map(Math.cos)) {
        for (var i = 0; i < order.length; i++) {
            switch (order[i]) {
                case "X":
                    this.rotateXInPlace(v.x, sin.x, cos.x);
                    break;
                case "Y":
                    this.rotateYInPlace(v.y, sin.y, cos.y);
                    break;
                case "Z":
                    this.rotateZInPlace(v.z, sin.z, cos.z);
                    break;
            }
        }
        return this;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    magnitudeSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    normalize() {
        const mag = this.magnitude();
        if (mag == 0) {
            return this;
        }
        return new this.constructor(this.x / mag, this.y / mag, this.z / mag);
    }

    normalizeInPlace() {
        const mag = this.magnitude();
        if (mag == 0) {
            return this;
        }
        this.x /= mag;
        this.y /= mag;
        this.z /= mag;
        return this;
    }

    lerp(v, c) {
        return new this.constructor(this.x + (v.x - this.x) * c, this.y + (v.y - this.y) * c, this.z + (v.z - this.z) * c);
    }

    distance(v) {
        return Math.sqrt((this.x - v.x) * (this.x - v.x) + (this.y - v.y) * (this.y - v.y) + (this.z - v.z) * (this.z - v.z));
    }

    distanceSquared(v) {
        return (this.x - v.x) * (this.x - v.x) + (this.y - v.y) * (this.y - v.y) + (this.z - v.z) * (this.z - v.z);
    }

    copy() {
        return new this.constructor(this.x, this.y, this.z);
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        return this;
    }

    set(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    map(f) {
        return new this.constructor(f(this.x), f(this.y), f(this.z));
    }

    mapInPlace(f) {
        this.x = f(this.x);
        this.y = f(this.y);
        this.z = f(this.z);
        return this;
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            z: this.z
        }
    }

    toArray() {
        return [this.x, this.y, this.z];
    }

    toString() {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }

    static from(x = 0, y = 0, z = 0) {
        return new this(x?.x ?? x[0] ?? x ?? 0,
            x?.y ?? x[1] ?? y ?? 0,
            x?.z ?? x[2] ?? z ?? 0);
    }

    static fromJSON(jsondata) {
        return new this(jsondata.x, jsondata.y, jsondata.z);
    }

    [Symbol.iterator]() {
        return [this.x, this.y, this.z][Symbol.iterator]();
    }
};

export default Vector3;