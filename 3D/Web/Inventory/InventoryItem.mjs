import Modal from "../Modal/Modal.mjs";
import Inventory from "./Inventory.mjs";
import WebComponent from "../WebComponent.mjs";

const InventoryItem = class extends WebComponent {
    constructor(options) {
        super(options);
        this.item = options?.item ?? null;
        this.stackable = options?.stackable ?? true;
        this.maxStack = options?.maxStack ?? 16;
        this.quantity = options?.quantity ?? 1;
        this.html = options?.html ?? null;
        this.actions = structuredClone(Inventory.ACTIONS);
        for (var action in this.actions) {
            this.actions[action] = options?.actions?.[action] ?? true;
        }
        this.nameElement = null;
        this.countElement = null;
        this.iconElement = null;
        this.inspectModal = null;
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

    createTooltipDescription(){
        return this.item.getToolTipHTML();
    }

    setTooltipDescription(x){
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
        return this.item.name == item.item.name && this.stackable;
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
            this.iconElement.style.display = 'block';
            if(this.iconElement.src != this.item.iconPath){
                this.iconElement.src = this.item.iconPath;
            }
        } else {
            this.iconElement.style.display = 'none';
            this.iconElement.src = '';
        }

        if (this.item.name) {
            this.nameElement.style.display = 'block';
            this.nameElement.textContent = this.item.name;
            this.nameElement.style.fontSize = this.nameElement.clientWidth / 4 + 'px';
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
            const itemInspectContent = this.item.getInspectHTML();
            if(this.inspectModal.content.innerHTML != itemInspectContent){
                this.inspectModal.content.innerHTML = itemInspectContent;
            }
            if(this.inspectModal.title != this.item.name){
                this.inspectModal.setTitle(this.item.name);
            }
        }
    }

    destroy() {
        if (this.inspectModal) {
            this.inspectModal.destroy();
            this.inspectModal = null;
        }
        this.html.remove();
        this.html = null;
        this.nameElement = null;
        this.countElement = null;
        this.iconElement = null;
        this.inspectModal = null;
    }

    clone() {

    }

}

export default InventoryItem;