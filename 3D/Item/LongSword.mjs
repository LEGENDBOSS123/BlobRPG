import Item from "./Item.mjs";

const LongSword = class extends Item {
    constructor(options) {
        super(options);
        this.damage = options?.damage ?? 40;
        this.width = 1;
        this.length = 5;
        this.reloadTime = options?.cooldown ?? 0;
        this.maxReloadTime = options?.maxCooldown ?? 1;
        this.maxStack = 1;
        this.stackable = false;
        this.description = "A bigger sword??";
        this.modelPath = "longsword.glb"
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