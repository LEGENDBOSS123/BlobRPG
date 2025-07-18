import GameEngineComponent from "../GameEngineComponent.mjs";

const Item = class extends GameEngineComponent {
    static ACTIONS = {
        TRASH: 0,
        INSPECT: 1,
        SPLIT: 2
    };
    static modelPath = "";
    static iconPath = "";

    constructor(options) {
        super(options);
        this.id = options?.id ?? -1;
        this.name = options?.name ?? "";
        this.type = new Set(options?.type ?? []);
        this.description = options?.description ?? "";
        this.iconPath = options?.iconPath ?? "";
        this.actions = structuredClone(Item.ACTIONS);
        for (var action in this.actions) {
            this.actions[action] = options?.actions?.[action] ?? true;
        }
        this.stackable = options?.stackable ?? true;
        this.maxStack = options?.maxStack ?? 16;
        this.quantity = options?.quantity ?? 1;
    }

    getToolTipHTML() {
        return `<div>${this.description}</div>`;
    }

    clone() {
        const cloned = super.clone();
        cloned.id = this.id;
        cloned.name = this.name;
        cloned.type = new Set([...this.type]);
        cloned.description = this.description;
        cloned.stackable = this.stackable;
        cloned.maxStack = this.maxStack;
        cloned.quantity = this.quantity;
        cloned.actions = structuredClone(this.actions);
        return cloned;
    }

    getCooldown() {
        return 0;
    }

    getCooldownRatio() {
        return 0;
    }

    getInspectHTML() {
        return this.getToolTipHTML();
    }
}

export default Item;