import Item from "./Item.mjs";

const Apple = class extends Item{
    constructor(options){
        super(options);
        this.heal = options?.heal ?? 25;
        this.maxStack = 32;
        this.stackable = true;
        this.description = "A healthy apple.";
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

    getCooldown(){
        return 0;
    }

    getCooldownRatio(){
        return 0;
    }

    clone(){
        const cloned = super.clone();
        cloned.heal = this.heal;
        return cloned;
    }
}

export default Apple;