import Modal from "../Modal/Modal.mjs";
import WebComponent from "../WebComponent.mjs";
import Item from "../../Item/Item.mjs";


class InventoryUI extends WebComponent {

    static draggingInventory = null;
    static draggingIndex = null;
    static dragging = false;

    constructor(options) {
        super(options);
        this.inventory = options.inventory;

        this.modal = new Modal(options);

        this.actionMenuContainer = null;

        this.slotsElements = new Array(this.inventory.size).fill(null);
        this.itemElements = new Array(this.inventory.size).fill(null);

        this.selectedIndex = -1;
    }

    updateItem(index) {
        const item = this.inventory.items[index];
        let myItemElement = this.itemElements[index];
        let mySlotElement = this.slotsElements[index];
        if (!myItemElement && item) {
            this.itemElements[index] = this.createItemHTML();
            myItemElement = this.itemElements[index];
            mySlotElement.itemContainer.appendChild(myItemElement.element);
            mySlotElement.element.classList.remove('empty');
        }
        if (!item && myItemElement) {
            myItemElement.element.remove();
            this.itemElements[index] = null;
            mySlotElement.itemContainer.innerHTML = '';
            mySlotElement.element.classList.add('empty');
            return;
        }
        if (!item && !myItemElement) {
            return;
        }


        myItemElement.nameElement.textContent = item.name;
        myItemElement.countElement.textContent = item.quantity;
        myItemElement.iconElement.src = this.gameEngine.graphicsEngine.textureLoader.resolvePath(item.constructor.iconPath);
        myItemElement.iconElement.style.display = "block";
        myItemElement.element.dataset.tooltipHTML = item.getToolTipHTML();
    }



    updateAll() {
        for (let i = 0; i < this.inventory.size; i++) {
            this.updateItem(i);
        }
    }

    createHTML(options) {
        var container = options.container;
        var gap = options.gap ?? "8px";

        var width = options?.width ?? 750;
        var height = options?.height ?? 600;

        var inventoryContainer = document.createElement("div");
        this.html = inventoryContainer;
        inventoryContainer.classList.add("inventory-container");

        var element = document.createElement("div");

        element.classList.add("inventory-grid-container");
        element.style.gridTemplateColumns = `repeat(${this.inventory.columns}, 1fr)`;
        element.style.gridTemplateRows = `repeat(${this.inventory.rows}, 1fr)`;
        element.style.gap = gap;
        element.style.padding = gap;
        inventoryContainer.style.overflow = options.overflow ? "auto" : "hidden";

        for (let row = 0; row < this.inventory.rows; row++) {
            for (let column = 0; column < this.inventory.columns; column++) {
                const slotHtml = this.createSlotHTML();
                element.appendChild(slotHtml.element);
                this.slotsElements[row * this.inventory.columns + column] = slotHtml;
            }
        }

        inventoryContainer.appendChild(element);


        this.setupDOMEventListeners();
        this.modal.content = this.html;
        this.modal.createHTML({
            width: width,
            height: height,
            centered: options?.centered ?? true,
            container: container
        });

        return this.html;
    }

    createSlotHTML() {
        const element = document.createElement('div');
        element.classList.add("inventory-slot", "empty");
        element.draggable = true;

        const itemContainer = document.createElement('div');
        itemContainer.classList.add('item-container');
        element.appendChild(itemContainer);

        return {
            element: element,
            itemContainer: itemContainer
        };
    }

    createItemHTML() {
        const element = document.createElement("div");
        element.classList.add("inventory-item");

        const iconContainer = document.createElement("div");
        iconContainer.classList.add("item-icon-container");
        element.appendChild(iconContainer);

        const iconElement = document.createElement('img');
        iconElement.className = 'item-icon';
        iconElement.style.display = 'none';
        iconContainer.appendChild(iconElement);

        const nameElement = document.createElement('span');
        nameElement.className = 'item-name';
        nameElement.display = 'none';
        element.appendChild(nameElement);

        const countElement = document.createElement('span');
        countElement.className = 'item-count';
        countElement.display = 'none';
        element.appendChild(countElement);

        const cooldownElement = document.createElement('div');
        cooldownElement.className = 'cooldown';
        cooldownElement.style.display = 'none';
        element.appendChild(cooldownElement);

        return {
            element: element,
            iconElement: iconElement,
            nameElement: nameElement,
            countElement: countElement
        };
    }

    setupDOMEventListeners() {
        for (let i = 0; i < this.slotsElements.length; i++) {
            this.addDOMEventListener("slot-dragstart-" + i, this.slotsElements[i].element, "dragstart", this.handleDragStart.bind(this, i));
            this.addDOMEventListener("slot-dragover-" + i, this.slotsElements[i].element, "dragover", this.handleDragOver.bind(this, i));
            this.addDOMEventListener("slot-drop-" + i, this.slotsElements[i].element, "drop", this.handleDrop.bind(this, i));
            this.addDOMEventListener("slot-dragleave-" + i, this.slotsElements[i].element, "dragleave", this.handleDragLeave.bind(this, i));
            this.addDOMEventListener("slot-click-" + i, this.slotsElements[i].element, "click", this.handleSlotClick.bind(this, i));

        }
    }

    handleDragStart(index, e) {
        if(this.inventory.items[index] == null) {
            return e.preventDefault();
        }
        this.constructor.dragging = true;
        this.constructor.draggingInventory = this;
        this.constructor.draggingIndex = index;
    }

    handleDragOver(index, e) {
        if(this.constructor.dragging) {
            e.preventDefault();
        }
    }

    handleDrop(index, e) {
        if(this.constructor.dragging) {
            this.inventory.swapOrStackItems(index, this.constructor.draggingInventory.inventory, this.constructor.draggingIndex);
            this.constructor.dragging = false;
            this.constructor.draggingInventory = null;
            this.constructor.draggingIndex = null;
        }
    }

    handleDragLeave() {
        
    }

    handleSlotClick(index, e) {
        this.inventory.select(index);
    }

    updateSelectedIndex(selectedIndex = this.selectedIndex){
        this.selectedIndex = selectedIndex;
        for(let i = 0; i < this.slotsElements.length; i++) {
            this.slotsElements[i].element.classList.remove('selected');
        }
        if(this.selectedIndex != -1) {
            this.slotsElements[this.selectedIndex].element.classList.add('selected');
        }
    }


    destroy() {

        this.modal.destroy();
        super.destroy();
    }

}

export default InventoryUI;