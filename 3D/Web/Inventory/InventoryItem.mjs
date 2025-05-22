const InventoryItem = class {
    constructor(options) {
        this.name = options?.name ?? "";
        this.description = options?.description ?? "";
        this.stackable = options?.stackable ?? true;
        this.maxStack = options?.maxStack ?? 16;
        this.quantity = options?.quantity ?? 1;
        this.icon = options?.icon ?? null;
        this.html = options?.html ?? null;
        this.actions = {
            trash: true,
            inspect: true,
            use: true
        }
        this.nameElement = null;
        this.countElement = null;
        this.iconElement = null;
    }

    createHTML() {
        var element = document.createElement("div");
        element.classList.add("inventory-item");


        var iconContainer = document.createElement("div");
        iconContainer.classList.add("item-icon-container");
        element.appendChild(iconContainer);

        this.iconElement = document.createElement('img');
        this.iconElement.className = 'item-icon';
        this.iconElement.style.display = 'none';
        iconContainer.appendChild(this.iconElement);

        this.nameElement = document.createElement('span');
        this.nameElement.className = 'item-name';
        this.nameElement.display = 'none';
        element.appendChild(this.nameElement);

        this.countElement = document.createElement('span');
        this.countElement.className = 'item-count';
        this.countElement.display = 'none';
        element.appendChild(this.countElement);

        this.html = element;
        this.updateHTML();
        return this.html;
    }

    canMergeWith(item) {
        return this.name == item.name && this.stackable;
    }
    
    canSwapWith(item) {
        return true;
    }

    updateHTML() {
        if (!this.html) {
            return this.createHTML();
        }


        if (this.icon) {
            this.iconElement.style.display = 'block';
            this.iconElement.src = this.icon;
        } else {
            this.iconElement.style.display = 'none';
            this.iconElement.src = '';
        }

        if (this.name) {
            this.nameElement.style.display = 'block';
            this.nameElement.textContent = this.name;
        } else {
            this.nameElement.style.display = 'none';
        }

        if (this.quantity > 1) {
            this.countElement.style.display = 'block';
            this.countElement.textContent = this.quantity;
        } else {
            this.countElement.style.display = 'none';
        }
    }


}

export default InventoryItem;