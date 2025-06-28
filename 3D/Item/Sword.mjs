import Item from "./Item.mjs";

const Sword = class extends Item {
    constructor(options) {
        super(options);
        this.damage = options?.damage ?? 10;
        this.reloadTime = options?.cooldown ?? 0;
        this.maxReloadTime = options?.maxCooldown ?? 1;
        this.maxStack = 1;
        this.stackable = false;
        this.description = "A sharp sword.";
    }

    getToolTipHTML() {
        return `
        <div>
            ${this.description}
            <br>Damage: ${this.damage}
            <br>Reload Time: ${this.maxReloadTime}
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
        return cloned;
    }
}

export default Sword;