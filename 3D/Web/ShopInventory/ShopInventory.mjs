import Modal from "../Modal/Modal.mjs";
import Toast from "../Toast/Toast.mjs";

const ShopInventory = class extends Modal {
    constructor(options) {
        super(options);

        this.items = [];
        this.itemElements = [];
        this.selectedIndex = -1;

        this.itemInfoContainer = null;
        this.itemElementContainer = null;
        this.itemInfoName = null;
        this.itemInfoImage = null;
        this.itemInfoDescription = null;
        this.itemInfoPrice = null;
        this.buyButton = null;
    }

    createHTML(options) {
        super.createHTML(options);
        this.content = document.createElement('div');
        this.content.classList.add('shop-inventory-container');

        const shopInventory = document.createElement('div');
        shopInventory.classList.add('shop-inventory');
        this.content.appendChild(shopInventory);

        this.itemInfoContainer = document.createElement('div');
        this.itemInfoContainer.classList.add('item-info-container');

        const nameImageContainer = document.createElement('div');
        nameImageContainer.classList.add('name-image-container');
        this.itemInfoContainer.appendChild(nameImageContainer);

        const itemInfoNameContainer = document.createElement('div');
        itemInfoNameContainer.classList.add('name-container');
        nameImageContainer.appendChild(itemInfoNameContainer);



        this.itemInfoName = document.createElement('span');
        this.itemInfoName.classList.add('name');
        itemInfoNameContainer.appendChild(this.itemInfoName);

        const itemInfoImageContainer = document.createElement('div');
        itemInfoImageContainer.classList.add('image-container');

        this.itemInfoImage = document.createElement('div');
        this.itemInfoImage.classList.add('image');
        itemInfoImageContainer.appendChild(this.itemInfoImage);
        nameImageContainer.appendChild(itemInfoImageContainer);

        const buyButtonContainer = document.createElement('div');
        buyButtonContainer.classList.add('buy-button-container');
        this.itemInfoContainer.appendChild(buyButtonContainer);

        this.buyButton = document.createElement('div');
        this.buyButton.classList.add('buy-button');
        buyButtonContainer.appendChild(this.buyButton);

        this.itemInfoPrice = document.createElement('span');
        this.itemInfoPrice.classList.add('price');
        this.buyButton.appendChild(this.itemInfoPrice);

        this.itemElementContainer = document.createElement('div');
        this.itemElementContainer.classList.add('item-element-container');
        shopInventory.appendChild(this.itemElementContainer);
        shopInventory.appendChild(this.itemInfoContainer);

        this.updateItems();
        this.setContent(this.content);
        this.setupShopEventListeners();
    }

    createItemHTML(item) {
        const itemElement = document.createElement('div');
        itemElement.classList.add('item-element');

        const itemName = document.createElement('span');
        itemName.classList.add('item-name');
        itemName.textContent = item.name;
        itemElement.appendChild(itemName);

        this.addEventListener("item-" + Math.random().toString(), itemElement, "click",
            function (e) {
                for (const ie of this.itemElements) {
                    ie.classList.remove('selected');
                }
                itemElement.classList.add('selected');
                this.selectedIndex = this.itemElements.indexOf(itemElement);
                this.updateItemInfo();
            }.bind(this)
        );
        return itemElement;
    }

    updateItemInfo() {
        const item = this.items[this.selectedIndex];
        this.itemInfoName.textContent = item.name;
        this.itemInfoImage.style.backgroundImage = `url(${item.icon})`;
        this.itemInfoPrice.textContent = "$100";
    }

    updateItems() {
        for (var name in this.eventListeners) {
            if (!name.startsWith('item-')) {
                continue;
            }
            this.removeEventListener(name);
        }
        this.itemElementContainer.innerHTML = '';
        for (const item of this.items) {
            const itemElement = this.createItemHTML(item);

            this.itemElementContainer.appendChild(itemElement);
            this.itemElements.push(itemElement);
        }
        this.itemElements[0]?.click();
    }

    setupShopEventListeners(){
        this.addEventListener("buy-click", this.buyButton, "click",
            function (e) {
                this.gameEngine.toastManager.createToast({ duration: 1000, type: Toast.TYPES.ERROR, message: "Buying not implemented yet" })
            }.bind(this)
        );
    }
}

export default ShopInventory;