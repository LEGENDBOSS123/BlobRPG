import GameEngineComponent from "../GameEngineComponent.mjs";

const Item = class extends GameEngineComponent{
    constructor(options){
        super(options);
        this.id = options?.id ?? -1;
        this.name = options?.name ?? "";
        this.type = options?.type ?? "";
        this.description = options?.description ?? "";
        this.iconPath = options?.iconPath ?? "";
        this.modelPath = options?.modelPath ?? "";
    }

    getToolTipHTML(){
        return `<div>${this.description}</div>`;
    }

    clone(){
        const cloned = super.clone();
        cloned.id = this.id;
        cloned.name = this.name;
        cloned.description = this.description;
        cloned.iconPath = this.iconPath;
        cloned.modelPath = this.modelPath;
        return cloned;
    }

    getInspectHTML(){
        return this.getToolTipHTML();
    }
}

export default Item;