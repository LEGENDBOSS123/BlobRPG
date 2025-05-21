
const Material = class {
    constructor(options) {
        this.restitution = options?.restitution ?? 0;
        this.friction = options?.friction ?? 0;
    }

    copy() {
        return new this.constructor(this);
    }

    setRestitution(restitution) {
        this.restitution = restitution;
    }

    setFriction(friction) {
        this.friction = friction;
    }

    combineRestitution(other) {
        return Math.sqrt(Math.max(0, this.restitution) * Math.max(0, other.restitution));
    }

    combineFriction(other) {
        return Math.max(0, (this.friction + other.friction) / 2);
    }

    getCombined(other) {
        return new this.constructor({ restitution: this.combineRestitution(other), friction: this.combineFriction(other) });
    }

    toJSON() {
        return { restitution: this.restitution, friction: this.friction };
    }

    static fromJSON(json) {
        return new this(json);
    }
};


export default Material;