import Item from "./Item.mjs";

const WoodenSword = class extends Item {

    static modelPath = "wooden_sword.glb";
    static iconPath = "wooden_sword.png";

    constructor(options) {
        super(options);
        this.maxStack = 1;
        this.stackable = false;
        this.description = "A not-so-sharp sword.";
        this.name = "Wooden Sword";
        this.type = new Set([
            "weapon",
            "melee",
            "sword",
            "wooden"
        ])

        this.damage = 10;
        this.width = 0.2;
        this.length = 2;
    }

    getToolTipHTML() {
        return `
        <div>
            ${this.description}
            <br>Damage: ${this.damage}
            <br>Length: ${this.length}
        </div>
        `;
    }

    clone() {
        const cloned = super.clone();
        cloned.damage = this.damage;
        cloned.length = this.length;
        cloned.width = this.width;
        cloned.length = this.length;
        return cloned;
    }
}

export default WoodenSword;