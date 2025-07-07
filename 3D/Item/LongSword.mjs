import Item from "./Item.mjs";

const LongSword = class extends Item {
    constructor(options) {
        super(options);
        this.damage = options?.damage ?? 3;
        this.width = 1.25;
        this.length = 12;
        this.reloadTime = options?.cooldown ?? 0;
        this.maxReloadTime = options?.maxCooldown ?? 1;
        this.maxStack = 1;
        this.stackable = false;
        this.description = "A bigger sword??";
    }

    getToolTipHTML() {
        return `
        <div>
            ${this.description}
            <br>Damage: ${this.damage}
            <br>Reload Time: ${this.maxReloadTime},
            <br>Length: ${this.length}
        </div>
        `;
    }

    getCooldown() {
        return this.reloadTime;
    }

    getCooldownRatio() {
        return this.reloadTime / this.maxReloadTime;
    }

    clone() {
        const cloned = super.clone();
        cloned.damage = this.damage;
        cloned.reloadTime = this.reloadTime;
        cloned.maxReloadTime = this.maxReloadTime;
        cloned.length = this.length;
        return cloned;
    }
}

export default LongSword;