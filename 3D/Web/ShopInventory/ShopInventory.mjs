import Modal from "../Modal/Modal.mjs";
import Toast from "../Toast/Toast.mjs";

const ShopInventory = class extends Modal {
    static itemDOMEventListenerIndex = 0;

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
        this.itemInfoQuantity = null;
        this.itemInfoPrice = null;
        this.buyButton = null;

        this.purchaseCallback = function (offer, quantity) {
            return 0;
        };
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


        this.itemInfoQuantity = document.createElement('span');
        this.itemInfoQuantity.classList.add('item-quantity');
        itemInfoNameContainer.appendChild(this.itemInfoQuantity);

        const itemInfoImageContainer = document.createElement('div');
        itemInfoImageContainer.classList.add('image-container');

        this.itemInfoImage = document.createElement('div');
        this.itemInfoImage.classList.add('image');
        itemInfoImageContainer.appendChild(this.itemInfoImage);
        nameImageContainer.appendChild(itemInfoImageContainer);

        const itemInfoDescriptionContainer = document.createElement('div');
        itemInfoDescriptionContainer.classList.add('description-container');
        this.itemInfoContainer.appendChild(itemInfoDescriptionContainer);

        this.itemInfoDescription = document.createElement('div');
        this.itemInfoDescription.classList.add('description');
        itemInfoDescriptionContainer.appendChild(this.itemInfoDescription);

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
        itemName.textContent = item.item.name;
        itemElement.appendChild(itemName);

        const quantity = document.createElement('span');
        quantity.classList.add('item-quantity');
        quantity.textContent = item.quantity == Infinity ? "" : "x" + item.quantity;
        itemElement.appendChild(quantity);

        const price = document.createElement('span');
        price.classList.add('item-price');
        price.textContent = "$" + item.price;
        itemElement.appendChild(price);

        item.id = ShopInventory.itemDOMEventListenerIndex++;

        this.addDOMEventListener("item-" + item.id, itemElement, "click",
            function (e) {
                this.select(this.itemElements.indexOf(itemElement)); 
            }.bind(this)
        );

        return itemElement;
    }

    select(index) {
        this.selectedIndex = index;
        for (const ie of this.itemElements) {
            ie.classList.remove('selected');
        }
        if(index == -1) {
            return this.updateItemInfo();
        }
        this.itemElements[index].classList.add('selected');
        this.updateItemInfo();
    }

    updateItemInfo() {
        if (this.selectedIndex == -1) {
            if (this.itemInfoContainer.style.visibility != 'hidden') {
                this.itemInfoContainer.style.visibility = 'hidden';
            }
            return;
        }
        if (this.itemInfoContainer.style.visibility != 'visible') {
            this.itemInfoContainer.style.visibility = 'visible';
        }

        const item = this.items[this.selectedIndex];
        this.itemInfoName.textContent = item.item.name;
        this.itemInfoQuantity.textContent = item.quantity == Infinity ? "" : "x" + item.quantity;
        this.itemInfoImage.style.backgroundImage = `url(${this.gameEngine.graphicsEngine.textureLoader.resolvePath(item.item.constructor.iconPath)})`;
        this.itemInfoPrice.textContent = "$" + item.price;
        this.itemInfoDescription.innerHTML = item.item.getToolTipHTML();
    }

    updateItems() {
        for (var name in this.DOMevents) {
            if (!name.startsWith('item-')) {
                continue;
            }
            this.removeDOMEventListener(name);
        }
        this.itemElementContainer.innerHTML = '';
        for (const item of this.items) {
            const itemElement = this.createItemHTML(item);
            this.itemElementContainer.appendChild(itemElement);
            this.itemElements.push(itemElement);
        }
        this.itemElements[0]?.click();
    }

    setupShopEventListeners() {
        this.addDOMEventListener("buy-click", this.buyButton, "click",
            function (e) {
                if (this.selectedIndex == -1) {
                    return;
                }
                const itemToBuy = this.items[this.selectedIndex];
                const quantityPurchase = this.purchaseCallback(itemToBuy, 1);
                if (quantityPurchase) {
                    this.gameEngine.toastManager.createToast({ duration: 1000, type: 0, message: `Purchased ${itemToBuy.item.name}` });
                    itemToBuy.quantity -= quantityPurchase;
                    if (itemToBuy.quantity <= 0) {
                        this.items.splice(this.selectedIndex, 1);
                        this.itemElements[this.selectedIndex].remove();
                        this.removeDOMEventListener("item-" + itemToBuy.id);
                        this.itemElements.splice(this.selectedIndex, 1);
                        this.selectedIndex = 0;
                        if (this.items.length == 0) {
                            this.selectedIndex = -1;
                        }
                        this.select(this.selectedIndex);
                    }
                    else{
                        this.itemElements[this.selectedIndex].querySelector('.item-quantity').textContent = itemToBuy.quantity == Infinity ? "" : "x" + itemToBuy.quantity;
                        this.updateItemInfo();
                    }
                }
            }.bind(this)
        );
    }
}

export default ShopInventory;