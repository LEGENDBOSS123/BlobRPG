import Inventory from "./Inventory.mjs";
import Modal from "../Modal/Modal.mjs";
import Toast from "../Toast/Toast.mjs";
import WebComponent from "../WebComponent.mjs";
import InventoryItem from "./InventoryItem.mjs";

const InventorySlot = class extends WebComponent {

    static dragging = null;

    constructor(options) {
        super(options);
        this.item = options?.item ?? null;
        this.html = options?.html ?? null;
        this.parent = options.parent;
        this.itemContainer = null;
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
        slot.item.item.quantity += this.item.item.quantity;
        if (slot.item.item.quantity > slot.item.item.maxStack) {
            var extra = slot.item.item.quantity - slot.item.item.maxStack;
            slot.item.item.quantity = slot.item.item.maxStack;
            this.item.item.quantity = extra;
            this.item.update();
        }
        else {
            this.item.destroy();
            this.item = null;
            this.update();
        }
    }

    canSwapWith(slot) {
        return this.item.canSwapWith(slot.item);
    }

    canMergeWith(slot) {
        if (!slot.item) {
            return false;
        }
        if (this.item.item.quantity == this.item.item.maxStack || slot.item.item.quantity == slot.item.item.maxStack) {
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
        if (this.item) {
            this.item.update();
        }
        this.updateHTML();
    }

    isTrashable() {
        return this.item && this.item.item.actions.TRASH;
    }

    isInspectable() {
        return this.item && this.item.item.actions.INSPECT;
    }

    isSplittable() {
        return this.item && this.item.item.quantity > 1 && this.item.item.actions.SPLIT;
    }


    setItem(item) {
        this.item = item;
        this.update();
    }

    inspectItem() {
        if (!this.item || !this.item.item.actions.INSPECT) {
            return;
        }

        this.item.createInspectModal({
            container: this.parent.modal.html.parentElement
        });
    }

    trashItem() {
        if (!this.item || !this.item.item.actions.TRASH) {
            return;
        }

        this.item.destroy();
        this.item = null;
        this.update();
    }

    splitItem() {
        if (!this.item || this.item.item.quantity <= 1 || !this.item.item.actions.SPLIT) {
            return;
        }

        var index = this.parent.emptyIndex();
        if (index == -1) {
            this.gameEngine.toastManager.createToast({ duration: 1000, type: Toast.TYPES.ERROR, message: "No space to split item." });
            return;
        }

        var portion1 = Math.floor(this.item.item.quantity / 2);
        var portion2 = this.item.item.quantity - portion1;

        const emptySlot = this.parent.getSlot(index.x, index.y);
        emptySlot.item = new InventoryItem({
            gameEngine: this.gameEngine,
            item: this.item.item.clone()
        });

        emptySlot.item.item.quantity = portion2;

        this.item.item.quantity = portion1;
        this.item.update();
        emptySlot.update();

    }

    setupEventListeners() {

        this.addEventListener("dragstart", this.html, "dragstart",
            function (e) {
                if (this.item == null) {
                    return e.preventDefault();
                }
                InventorySlot.dragging = this;
                Inventory.hideActionContainer();
            }.bind(this)
        );

        this.addEventListener("dragover", this.html, "dragover",
            function (e) {
                if (InventorySlot.dragging) {
                    e.preventDefault();
                }
            }.bind(this)
        );

        this.addEventListener("drop", this.html, "drop",
            function (e) {
                e.preventDefault();
                if (InventorySlot.dragging) {
                    this.gameEngine.soundManager.play("click", 0.75);
                    var other = InventorySlot.dragging;
                    InventorySlot.dragging = null;
                    if (other.canMergeWith(this)) {
                        other.mergeWith(this);
                    }
                    else if (other.canSwapWith(this)) {
                        other.swapWith(this);
                    }
                }
            }.bind(this)
        );

        this.addEventListener("click", this.html, "click",
            function (e) {
                if (Inventory.actionButtonTarget == this) {
                    Inventory.hideActionContainer();
                    return;
                }
                if (Modal.isChildClipped(this.html, this.parent.html)) {
                    this.html.scrollIntoView({
                        block: "nearest",
                        inline: "nearest",
                        behavior: "auto"
                    });
                }
                Inventory.centerActionButtonTarget(this);
            }.bind(this)
        )

        this.addEventListener("mousedown", this.html, "mousedown",
            function (e) {
                if (Inventory.actionButtonTarget && Inventory.actionButtonTarget != this) {
                    Inventory.hideActionContainer();
                }
            }.bind(this)
        );

    }

    destroy() {
        super.destroy();
        this.html.remove();
        this.itemContainer = null;
        this.item = null;
        this.html = null;
        this.parent = null;
    }
}

export default InventorySlot;