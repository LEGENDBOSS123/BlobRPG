import Item from "./Item.mjs";

const IronSword = class extends Item {
    static modelPath = "longsword.glb"
    static iconPath = "sword.png"
    constructor(options) {
        super(options);
        this.maxStack = 1;
        this.stackable = false;
        this.description = "A bigger sword??";
        this.name = "Iron Sword";
        this.type = new Set([
            "weapon",
            "melee",
            "sword",
            "iron",
            "long"
        ]);


        this.damage = 40;
        this.width = 1;
        this.length = 5;
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
        return cloned;
    }
}

export default IronSword;