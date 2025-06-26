import GameEngineComponent from "../../GameEngineComponent.mjs";

class ShopOffer extends GameEngineComponent{
    constructor(options){
        super(options);
        this.id = options?.id ?? -1;
        this.item = options?.item ?? null;
        this.price = options?.price ?? 100;
        this.quantity = options?.quantity ?? 1;
    }
}


export default ShopOffer;