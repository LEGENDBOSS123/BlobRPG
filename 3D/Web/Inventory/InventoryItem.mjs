import Modal from "../Modal/Modal.mjs";
import Inventory from "./Inventory.mjs";
import WebComponent from "../WebComponent.mjs";
import Item from "../../Item/Item.mjs";

const InventoryItem = class extends WebComponent {
    constructor(options) {
        super(options);
        this.item = options?.item ?? null;
        this.html = options?.html ?? null;
        this.nameElement = null;
        this.countElement = null;
        this.iconElement = null;
        this.inspectModal = null;
        this.cooldownElement = null;
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

        this.cooldownElement = document.createElement('div');
        this.cooldownElement.className = 'cooldown';
        element.appendChild(this.cooldownElement);

        this.html = element;
        this.updateHTML();
        return this.html;
    }

    createTooltipDescription() {
        return this.item.getToolTipHTML();
    }

    setTooltipDescription(x) {
        this.html.dataset.tooltipHTML = x;
    }

    createInspectModal({ container }) {

        if (this.inspectModal) {
            this.inspectModal.open();
            this.inspectModal.bringToFront();
            return;
        }

        this.inspectModal = new Modal({
            gameEngine: this.gameEngine,
            title: this.name
        });

        this.inspectModal.content = document.createElement('div');

        this.inspectModal.createHTML({
            container: container,
            width: 400,
            height: 200,
            centered: true
        })
        this.inspectModal.bringToFront();
    }

    canMergeWith(item) {
        return this.item.name == item.item.name && this.item.stackable;
    }

    canSwapWith(item) {
        return true;
    }

    update() {
        this.updateHTML();
        this.setTooltipDescription(this.createTooltipDescription());
    }

    updateHTML() {
        if (!this.html) {
            return this.createHTML();
        }

        if (this.item.iconPath) {
            if (this.iconElement.style.display != "block") {
                this.iconElement.style.display = 'block';
            }
            if (!this.iconElement.src || new URL(this.iconElement.src).href !== new URL(this.item.iconPath, document.baseURI).href) {
                this.iconElement.src = this.item.iconPath;
            }

        } else {
            if (this.iconElement.style.display != "none") {
                this.iconElement.style.display = 'none';
            }
            if (this.iconElement.src) {
                this.iconElement.src = null;
            }
        }

        if (this.item.name) {
            if (this.nameElement.style.display != "block") {
                this.nameElement.style.display = 'block';
            }
            if (this.item.name != this.nameElement.textContent) {
                this.nameElement.textContent = this.item.name;
            }
            if (this.nameElement.style.fontSize != this.nameElement.clientWidth / 4 + 'px') {
                this.nameElement.style.fontSize = this.nameElement.clientWidth / 4 + 'px';
            }
        } else {
            if (this.nameElement.style.display != "none") {
                this.nameElement.style.display = 'none';
            }
        }

        if (this.item.quantity > 1) {
            if (this.countElement.style.display != "block") {
                this.countElement.style.display = 'block';
            }
            if (this.item.quantity != this.countElement.textContent) {
                this.countElement.textContent = this.item.quantity;
            }
        } else {
            if (this.countElement.style.display != "none") {
                this.countElement.style.display = 'none';
            }
        }

        if (this.item.getCooldownRatio() >= 0) {
            if (this.cooldownElement.style.display != "block") {
                this.cooldownElement.style.display = 'block';
            }
            if (this.item.getCooldownRatio() != 0 || this.cooldownElement.style.height != "0%") {
                this.cooldownElement.style.height = `${this.item.getCooldownRatio() * 100}%`;
            }

        } else {
            if (this.cooldownElement.style.display != "none") {
                this.cooldownElement.style.height = "0%";
            }
        }

        if (this.inspectModal) {
            const itemInspectContent = this.item.getInspectHTML();
            if (this.inspectModal.content.innerHTML != itemInspectContent) {
                this.inspectModal.content.innerHTML = itemInspectContent;
            }
            if (this.inspectModal.title != this.item.name) {
                this.inspectModal.setTitle(this.item.name);
            }
        }
    }

    destroy() {
        if (this.inspectModal) {
            this.inspectModal.destroy();
            this.inspectModal = null;
        }
        if (this.item) {
            this.item.destroy();
            this.item = null;
        }
        this.html.remove();
        this.html = null;
        this.nameElement = null;
        this.countElement = null;
        this.iconElement = null;
        this.inspectModal = null;
        this.cooldownElement = null;
    }

    clone() {

    }

}

export default InventoryItem;