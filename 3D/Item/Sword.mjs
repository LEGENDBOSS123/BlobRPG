import Item from "./Item.mjs";

const Sword = class extends Item {
    constructor(options) {
        super(options);
        this.damage = options?.damage ?? 10;
        this.reloadTime = options?.cooldown ?? 0;
        this.maxReloadTime = options?.maxCooldown ?? 1;
        this.maxStack = 1;
        this.stackable = false;
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
        return this.reloadTime / this.maxReloadTime + 0.5+Math.sin(performance.now() * 0.01)/2;
    }

    clone() {
        const cloned = super.clone();
        cloned.damage = this.damage;
        return cloned;
    }
}

export default Sword;