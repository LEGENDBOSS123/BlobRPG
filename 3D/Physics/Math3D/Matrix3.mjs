import Vector3 from "./Vector3.mjs";

var Matrix3 = class {

    constructor(options) {
        this.elements = options?.elements ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    scale(s) {
        const result = new this.constructor();
        result.elements = [
            this.elements[0] * s,
            this.elements[1] * s,
            this.elements[2] * s,
            this.elements[3] * s,
            this.elements[4] * s,
            this.elements[5] * s,
            this.elements[6] * s,
            this.elements[7] * s,
            this.elements[8] * s,
        ];
        return result;
    }

    scaleInPlace(s) {
        this.elements[0] *= s;
        this.elements[1] *= s;
        this.elements[2] *= s;
        this.elements[3] *= s;
        this.elements[4] *= s;
        this.elements[5] *= s;
        this.elements[6] *= s;
        this.elements[7] *= s;
        this.elements[8] *= s;
        return this;
    }

    add(m) {
        const result = new this.constructor();
        result.elements = [
            this.elements[0] + m.elements[0],
            this.elements[1] + m.elements[1],
            this.elements[2] + m.elements[2],
            this.elements[3] + m.elements[3],
            this.elements[4] + m.elements[4],
            this.elements[5] + m.elements[5],
            this.elements[6] + m.elements[6],
            this.elements[7] + m.elements[7],
            this.elements[8] + m.elements[8],
        ];
        return result;
    }

    addInPlace(m) {
        this.elements[0] += m.elements[0];
        this.elements[1] += m.elements[1];
        this.elements[2] += m.elements[2];
        this.elements[3] += m.elements[3];
        this.elements[4] += m.elements[4];
        this.elements[5] += m.elements[5];
        this.elements[6] += m.elements[6];
        this.elements[7] += m.elements[7];
        this.elements[8] += m.elements[8];
        return this;
    }

    multiplyVector3(v) {
        const result = new Vector3();
        result.x = this.elements[0] * v.x + this.elements[1] * v.y + this.elements[2] * v.z;
        result.y = this.elements[3] * v.x + this.elements[4] * v.y + this.elements[5] * v.z;
        result.z = this.elements[6] * v.x + this.elements[7] * v.y + this.elements[8] * v.z;
        return result;
    }

    multiply(m2) {
        const m = m2.elements;
        const result = new this.constructor();
        result.elements = [
            this.elements[0] * m[0] + this.elements[3] * m[1] + this.elements[6] * m[2],
            this.elements[1] * m[0] + this.elements[4] * m[1] + this.elements[7] * m[2],
            this.elements[2] * m[0] + this.elements[5] * m[1] + this.elements[8] * m[2],
            this.elements[0] * m[3] + this.elements[3] * m[4] + this.elements[6] * m[5],
            this.elements[1] * m[3] + this.elements[4] * m[4] + this.elements[7] * m[5],
            this.elements[2] * m[3] + this.elements[5] * m[4] + this.elements[8] * m[5],
            this.elements[0] * m[6] + this.elements[3] * m[7] + this.elements[6] * m[8],
            this.elements[1] * m[6] + this.elements[4] * m[7] + this.elements[7] * m[8],
            this.elements[2] * m[6] + this.elements[5] * m[7] + this.elements[8] * m[8]
        ];

        return result;
    }

    multiplyInPlace(m) {
        this.elements = this.multiply(m).elements;
        return this;
    }

    invert() {
        const determinant = this.elements[0] * (this.elements[4] * this.elements[8] - this.elements[5] * this.elements[7]) - this.elements[1] * (this.elements[3] * this.elements[8] - this.elements[5] * this.elements[6]) + this.elements[2] * (this.elements[3] * this.elements[7] - this.elements[4] * this.elements[6]);
        if (Math.abs(determinant) < 1e-10) {
            return this.constructor.zero();
        }
        const inverseDeterminant = 1 / determinant;
        const result = new this.constructor();
        result.elements = [
            (this.elements[4] * this.elements[8] - this.elements[5] * this.elements[7]) * inverseDeterminant,
            (this.elements[2] * this.elements[7] - this.elements[1] * this.elements[8]) * inverseDeterminant,
            (this.elements[1] * this.elements[5] - this.elements[2] * this.elements[4]) * inverseDeterminant,
            (this.elements[5] * this.elements[6] - this.elements[3] * this.elements[8]) * inverseDeterminant,
            (this.elements[0] * this.elements[8] - this.elements[2] * this.elements[6]) * inverseDeterminant,
            (this.elements[2] * this.elements[3] - this.elements[0] * this.elements[5]) * inverseDeterminant,
            (this.elements[3] * this.elements[7] - this.elements[4] * this.elements[6]) * inverseDeterminant,
            (this.elements[1] * this.elements[6] - this.elements[0] * this.elements[7]) * inverseDeterminant,
            (this.elements[0] * this.elements[4] - this.elements[1] * this.elements[3]) * inverseDeterminant
        ];

        return result;
    }

    invertInPlace() {
        const det = this.elements[0] * (this.elements[4] * this.elements[8] - this.elements[5] * this.elements[7]) -
            this.elements[1] * (this.elements[3] * this.elements[8] - this.elements[5] * this.elements[6]) +
            this.elements[2] * (this.elements[3] * this.elements[7] - this.elements[4] * this.elements[6]);

        if (Math.abs(det) < 1e-10) {
            return this.constructor.zero();
        }

        const invDet = 1 / det;

        const a00 = this.elements[0];
        const a01 = this.elements[1];
        const a02 = this.elements[2];
        const a10 = this.elements[3];
        const a11 = this.elements[4];
        const a12 = this.elements[5];
        const a20 = this.elements[6];
        const a21 = this.elements[7];
        const a22 = this.elements[8];

        this.elements[0] = (a11 * a22 - a12 * a21) * invDet;
        this.elements[1] = (a02 * a21 - a01 * a22) * invDet;
        this.elements[2] = (a01 * a12 - a02 * a11) * invDet;

        this.elements[3] = (a12 * a20 - a10 * a22) * invDet;
        this.elements[4] = (a00 * a22 - a02 * a20) * invDet;
        this.elements[5] = (a02 * a10 - a00 * a12) * invDet;

        this.elements[6] = (a10 * a21 - a11 * a20) * invDet;
        this.elements[7] = (a01 * a20 - a00 * a21) * invDet;
        this.elements[8] = (a00 * a11 - a01 * a10) * invDet;

        return this;
    }


    transpose() {
        const result = new this.constructor();
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                result.set(i, j, this.get(j, i));
            }
        }
        return result;
    }

    transposeInPlace() {
        var temp;
        temp = this.elements[1];
        this.elements[1] = this.elements[3];
        this.elements[3] = temp;
        temp = this.elements[2];
        this.elements[2] = this.elements[6];
        this.elements[6] = temp;
        temp = this.elements[5];
        this.elements[5] = this.elements[7];
        this.elements[7] = temp;

        temp = this.elements[3];
        this.elements[3] = this.elements[1];
        this.elements[1] = temp;
        temp = this.elements[6];
        this.elements[6] = this.elements[2];
        this.elements[2] = temp;
        temp = this.elements[7];
        this.elements[7] = this.elements[5];
        this.elements[5] = temp;

        return this;
    }

    get(row, column) {
        return this.elements[row * 3 + column];
    }

    set(row, column, value) {
        this.elements[row * 3 + column] = value;
    }

    setMatrix3(m) {
        this.elements = [...m.elements];
        return this;
    }

    copy() {
        return new this.constructor(this);
    }

    reset() {
        this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    static identity() {
        return new this({ elements: [1, 0, 0, 0, 1, 0, 0, 0, 1] });
    }

    static zero() {
        return new this({ elements: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
    }

    static from(elements) {
        return new this({ elements: elements });
    }

    static from2dArray(elements) {
        return new this({ elements: elements.flat() });
    }

    to2dArray() {
        const array = [];
        for (var i = 0; i < 3; i++) {
            array.push(this.elements.slice(i * 3, i * 3 + 3));
        }
        return array;
    }

    toString() {
        const fixedNumber = 8;
        return `${this.elements[0].toFixed(fixedNumber)} ${this.elements[1].toFixed(fixedNumber)} ${this.elements[2].toFixed(fixedNumber)}
${this.elements[3].toFixed(fixedNumber)} ${this.elements[4].toFixed(fixedNumber)} ${this.elements[5].toFixed(fixedNumber)}
${this.elements[6].toFixed(fixedNumber)} ${this.elements[7].toFixed(fixedNumber)} ${this.elements[8].toFixed(fixedNumber)}`
    }

    toJSON() {
        return [...this.elements];
    }

    static fromJSON(json) {
        return new this({ elements: [...json] });
    }
};


export default Matrix3;