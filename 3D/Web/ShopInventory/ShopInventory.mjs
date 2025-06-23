import Modal from "../Modal/Modal.mjs";

const ShopInventory = class extends Modal{
    constructor(options){
        super(options);

        this.items = [];

        this.itemInfoContainer = null;
        this.itemElementContainer = null;
        this.itemInfoName = null;
        this.itemInfoDescription = null;
        this.itemInfoStatsContainer = null;
        this.itemInfoPrice = null;
        this.buyButton = null;
    }

    createHTML(options){
        super.createHTML(options);
        this.content = document.createElement('div');
        this.content.classList.add('shop-inventory-container');

        const shopInventory = document.createElement('div');
        shopInventory.classList.add('shop-inventory');
        this.content.appendChild(shopInventory);

        this.itemInfoContainer = document.createElement('div');
        this.itemInfoContainer.classList.add('item-info-container');

        this.itemElementContainer = document.createElement('div');
        this.itemElementContainer.classList.add('item-element-container');
        shopInventory.appendChild(this.itemElementContainer);
        shopInventory.appendChild(this.itemInfoContainer);
        this.setContent(this.content);
    }
}

export default ShopInventory;