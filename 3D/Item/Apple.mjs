import Item from "./Item.mjs";

const Apple = class extends Item{
    static iconPath = "apple.png"
    constructor(options){
        super(options);
        this.maxStack = 32;
        this.stackable = true;
        this.description = "A healthy apple.";
        this.name = "Apple"
        this.type = new Set([
            "food",
            "apple",
            "heal",
            "fruit"
        ])

        this.heal = options?.heal ?? 25;
    }

    getToolTipHTML(){
        return `
        <div>
            ${this.description}
            <br>Heal: ${this.heal}
        </div>
        `;
    }

    use(player){
        player.health += this.heal;
        if(player.health > player.maxHealth){
            // player.health = player.maxHealth;
        }
    }

    clone(){
        const cloned = super.clone();
        cloned.heal = this.heal;
        return cloned;
    }
}

export default Apple;