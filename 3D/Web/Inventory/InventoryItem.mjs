import Modal from "../Modal/Modal.mjs";

const InventoryItem = class {
    constructor(options) {
        this.name = options?.name ?? "";
        this.description = options?.description ?? "This is an item";
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
        this.inspectModal = null;
        this.eventListeners = null;
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

    createInspectModal({ container }) {

        if (this.inspectModal) {
            this.inspectModal.open();
            this.inspectModal.bringToFront();
            return;
        }

        this.inspectModal = new Modal({
            title: this.name
        });

        this.inspectModal.content = document.createElement('p');
        this.inspectModal.content.textContent = this.description;

        this.inspectModal.createHTML({
            container: container,
            width: 400,
            height: 200,
            centered: true
        })
        this.inspectModal.bringToFront();
    }

    canMergeWith(item) {
        return this.name == item.name && this.stackable;
    }

    canSwapWith(item) {
        return true;
    }

    update() {
        this.updateHTML();
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

        if (this.inspectModal) {
            this.inspectModal.content.textContent = this.description + " and has " + this.quantity + " " + this.name;
        }
    }

    destroy() {
        if (this.inspectModal) {
            this.inspectModal.destroy();
            this.inspectModal = null;
        }
        this.html.remove();
        this.html = null;
        this.icon = null;
        this.nameElement = null;
        this.countElement = null;
        this.iconElement = null;
        this.inspectModal = null;
        this.eventListeners = null;
    }

}

export default InventoryItem;