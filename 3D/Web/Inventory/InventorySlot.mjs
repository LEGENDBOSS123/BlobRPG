import Inventory from "./Inventory.mjs";

const InventorySlot = class {

    static dragging = null;

    constructor(options) {
        this.item = options?.item ?? null;
        this.html = options?.html ?? null;
        this.document = options?.document ?? null;
        this.parent = options.parent;
        this.itemContainer = null;
    }

    swapWith(slot) {
        if(slot == this) {
            return;
        }
        [this.item, slot.item] = [slot.item, this.item];
    }

    mergeWith(slot) {
        if(slot == this) {
            return false;
        }
        slot.item.quantity += this.item.quantity;
        if(slot.item.quantity > slot.item.maxStack) {
            var extra = slot.item.quantity - slot.item.maxStack;
            slot.item.quantity = slot.item.maxStack;
            this.item.quantity = extra;
        }
        else{
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
        if(this.item.quantity == this.item.maxStack || slot.item.quantity == slot.item.maxStack) {
            return false;
        }
        return this.item.canMergeWith(slot.item);
    }

    setItem(item) {
        this.item = item;
        this.updateHTML();
    }

    createHTML() {
        var element = this.document.createElement('div');
        element.classList.add("inventory-slot", "empty");
        element.draggable = true;

        this.itemContainer = this.document.createElement('div');
        this.itemContainer.classList.add('item-container');
        element.appendChild(this.itemContainer);

        this.html = element;
        this.setupEventListeners();
        return this.html;
    }

    updateHTML() {
        if (this.item) {
            this.item.updateHTML({
                document: this.document
            });
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

    setupEventListeners() {
        this.html.addEventListener("dragstart", function(e){
            if(this.item == null) {
                return e.preventDefault();
            }
            InventorySlot.dragging = this;
            
        }.bind(this));

        this.html.addEventListener("dragover", function(e){
            if (InventorySlot.dragging) {
                e.preventDefault();
            }
        }.bind(this));

        this.html.addEventListener("drop", function(e){
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
            
        }.bind(this));

        this.html.addEventListener("click", function(e){
            if(Inventory.actionButtonAround == this){
                Inventory.hideActionContainer();
                return;
            }
            Inventory.centerActionButtonAround(this);
        }.bind(this));
    }

}

export default InventorySlot;