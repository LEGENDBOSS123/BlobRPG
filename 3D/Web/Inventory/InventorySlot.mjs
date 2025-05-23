import Inventory from "./Inventory.mjs";
import Modal from "../Modal/Modal.mjs";

const InventorySlot = class {

    static dragging = null;

    constructor(options) {
        this.item = options?.item ?? null;
        this.html = options?.html ?? null;
        this.parent = options.parent;
        this.itemContainer = null;
        this.eventListeners = null;
    }

    swapWith(slot) {
        if (slot == this) {
            return;
        }
        [this.item, slot.item] = [slot.item, this.item];
    }

    mergeWith(slot) {
        if (slot == this) {
            return false;
        }
        slot.item.quantity += this.item.quantity;
        if (slot.item.quantity > slot.item.maxStack) {
            var extra = slot.item.quantity - slot.item.maxStack;
            slot.item.quantity = slot.item.maxStack;
            this.item.quantity = extra;
            this.item.update();
        }
        else {
            this.item.destroy();
            this.item = null;
        }
    }

    canSwapWith(slot) {
        return this.item.canSwapWith(slot.item);
    }

    canMergeWith(slot) {
        if (!slot.item) {
            return false;
        }
        if (this.item.quantity == this.item.maxStack || slot.item.quantity == slot.item.maxStack) {
            return false;
        }
        return this.item.canMergeWith(slot.item);
    }

    createHTML() {
        var element = document.createElement('div');
        element.classList.add("inventory-slot", "empty");
        element.draggable = true;

        this.itemContainer = document.createElement('div');
        this.itemContainer.classList.add('item-container');
        element.appendChild(this.itemContainer);

        this.html = element;
        this.setupEventListeners();
        return this.html;
    }

    updateHTML() {
        if (this.item) {
            this.item.updateHTML();
        }
        if (!this.item) {
            this.html.classList.add('empty');
            this.itemContainer.innerHTML = '';
        } else {
            this.html.classList.remove('empty');
            if (this.itemContainer.children.length == 0) {
                this.itemContainer.appendChild(this.item.html);
            }
            else if (!this.itemContainer.contains(this.item.html)) {
                this.itemContainer.innerHTML = '';
                this.itemContainer.appendChild(this.item.html);
            }
        }
    }

    update() {
        this.updateHTML();
    }


    setItem(item) {
        this.item = item;
        this.update();
    }

    inspectItem() {
        if (!this.item) {
            return;
        }

        this.item.createInspectModal({
            container: this.parent.modal.html.parentElement
        });
    }

    trashItem() {
        if (!this.item) {
            return;
        }

        this.item.destroy();
        this.item = null;
    }

    setupEventListeners() {
        if (this.eventListeners) {
            return;
        }

        this.eventListeners = {};

        this.eventListeners.dragstart = function (e) {
            if (this.item == null) {
                return e.preventDefault();
            }
            InventorySlot.dragging = this;
        }.bind(this);

        this.eventListeners.dragover = function (e) {
            if (InventorySlot.dragging) {
                e.preventDefault();
            }
        }.bind(this);

        this.eventListeners.drop = function (e) {
            e.preventDefault();
            if (InventorySlot.dragging) {
                var other = InventorySlot.dragging;
                InventorySlot.dragging = null;
                if (other.canMergeWith(this)) {
                    other.mergeWith(this);
                }
                else if (other.canSwapWith(this)) {
                    other.swapWith(this);
                }
            }
        }.bind(this);

        this.eventListeners.click = function (e) {
            if (Inventory.actionButtonAround == this) {
                Inventory.hideActionContainer();
                return;
            }
            Inventory.centerActionButtonAround(this);
        }.bind(this);


        this.eventListeners.mousedown = function(e){
            if(Inventory.actionButtonAround && Inventory.actionButtonAround != this){
                Inventory.hideActionContainer();
            }
        }.bind(this);


        this.html.addEventListener("dragstart", this.eventListeners.dragstart);
        this.html.addEventListener("dragover", this.eventListeners.dragover);
        this.html.addEventListener("drop", this.eventListeners.drop);
        this.html.addEventListener("click", this.eventListeners.click);
        this.html.addEventListener("mousedown", this.eventListeners.mousedown);
    }

    destroy() {
        if (this.eventListeners) {
            this.html.removeEventListener("dragstart", this.eventListeners.dragstart);
            this.html.removeEventListener("dragover", this.eventListeners.dragover);
            this.html.removeEventListener("drop", this.eventListeners.drop);
            this.html.removeEventListener("click", this.eventListeners.click);
            this.html.removeEventListener("mousedown", this.eventListeners.mousedown);
        }
        this.html.remove();
        this.itemContainer = null;
        this.eventListeners = null;
        this.item = null;
        this.html = null;
        this.parent = null;
    }
}

export default InventorySlot;