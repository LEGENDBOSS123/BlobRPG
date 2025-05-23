import InventorySlot from "./InventorySlot.mjs";
import Modal from "../Modal/Modal.mjs";

const Inventory = class {

    static actionButtonAround = null;
    static eventListeners = null;
    static actionContainer = null;
    static actionButtons = [];
    static actionButtonSize = 50;

    static ACTIONS = {
        TRASH: 0,
        INSPECT: 1
    }

    constructor(options) {
        this.rows = options?.rows ?? 5;
        this.columns = options?.columns ?? 5;
        this.slots = [];
        for (let i = 0; i < this.rows; i++) {
            this.slots[i] = [];
            for (let j = 0; j < this.columns; j++) {
                this.slots[i][j] = new InventorySlot({
                    parent: this
                });
            }
        }
        this.eventListeners = null;
        this.modal = new Modal(options);
        this.html = null;
    }

    static hideActionContainer() {
        if (Inventory.actionButtonAround) {
            Inventory.actionContainer.style.display = 'none';
            Inventory.actionButtonAround = null;
        }
    }

    static showActionContainer() {
        if (Inventory.actionButtonAround) {
            Inventory.actionContainer.style.display = 'flex';
            Inventory.actionContainer.style.zIndex = 1 + Inventory.actionButtonAround.parent.modal.html.style.zIndex;
            if (!document.body.contains(Inventory.actionContainer)) {
                document.body.appendChild(Inventory.actionContainer);
            }
        }
    }

    static centerActionButtonAround(slot) {
        Inventory.hideActionContainer();
        if (!slot.item) {
            return;
        }
        Inventory.actionButtonAround = slot;
        Inventory.showActionContainer();

        var slotRect = slot.html.getBoundingClientRect();
        var actionContainerParent = Inventory.actionContainer.parentElement.getBoundingClientRect();

        Inventory.actionContainer.style.left = `${slotRect.left - actionContainerParent.left}px`;
        Inventory.actionContainer.style.top = `${slotRect.top - actionContainerParent.top}px`;

        Inventory.actionContainer.style.width = `${slot.html.offsetWidth}px`;
        Inventory.actionContainer.style.height = `${slot.html.offsetHeight}px`;

        for (var index = 0; index < Inventory.actionButtons.length; index++) {
            var button = Inventory.actionButtons[index];
            switch (index) {
                case this.ACTIONS.TRASH:
                    button.style.top = `calc(-10% - ${button.offsetWidth}px)`;
                    button.style.bottom = "";
                    button.style.left = "50%";
                    break;
                case this.ACTIONS.INSPECT:
                    button.style.left = `calc(-10% - ${button.offsetWidth}px)`;
                    button.style.right = "";
                    button.style.top = "50%";
                    break;
                default:
                    break;
            }
            button.style.width = `${Inventory.actionButtonSize}px`;
            button.style.height = `${Inventory.actionButtonSize}px`;
        }


    }

    getSlot(x, y) {
        return this.slots[y][x];
    }

    setSlot(x, y, slot) {
        this.slots[y][x] = slot;
    }

    createHTML(options) {
        var container = options.container;
        var gap = options.gap ?? "8px";

        var width = options?.width ?? 750;
        var height = options?.height ?? 600;

        var inventoryContainer = document.createElement("div");
        inventoryContainer.classList.add("inventory-container");

        var element = document.createElement("div");

        element.classList.add("inventory-grid-container");
        element.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
        element.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        element.style.gap = gap;
        element.style.padding = gap;
        inventoryContainer.style.overflow = options.overflow ? "auto" : "hidden";

        for (var row = 0; row < this.rows; row++) {
            for (var column = 0; column < this.columns; column++) {
                var slot = this.getSlot(column, row);
                var slotElememt = slot.createHTML();
                element.appendChild(slotElememt);
            }
        }

        inventoryContainer.appendChild(element);
        this.html = inventoryContainer;

        Inventory.createHTML();
        Inventory.setupEventListeners();
        this.setupEventListeners();
        this.modal.content = this.html;
        this.modal.createHTML({
            container: container,
            width: width,
            height: height,
            centered: options?.centered
        });

        return this.html;
    }

    update() {
        for (var row = 0; row < this.rows; row++) {
            for (var column = 0; column < this.columns; column++) {
                var slot = this.getSlot(column, row);
                slot.update();
            }
        }
        this.modal.update();
        if (Inventory.actionButtonAround && Inventory.actionButtonAround.parent == this) {
            Inventory.centerActionButtonAround(Inventory.actionButtonAround);
        }
    }

    emptyIndex() {
        for (var row = 0; row < this.rows; row++) {
            for (var column = 0; column < this.columns; column++) {
                var slot = this.getSlot(column, row);
                if (!slot.item) {
                    return {
                        x: column,
                        y: row
                    };
                }
            }
        }
        return -1;
    }

    static createHTML() {
        if (this.actionContainer) {
            return;
        }
        this.actionContainer = document.createElement('div');
        this.actionContainer.classList.add('action-container');

        for (var index = 0; index < Object.keys(this.ACTIONS).length; index++) {
            var button = document.createElement('button');
            button.classList.add('action-button');


            switch (index) {
                case this.ACTIONS.TRASH:
                    button.innerHTML = '🗑️';
                    button.style.transform = "translateX(-50%)";
                    break;
                case this.ACTIONS.INSPECT:
                    button.innerHTML = '🔎';
                    button.style.transform = "translateY(-50%)";
                    break;
                default:
                    break;
            }

            this.actionContainer.appendChild(button);
            this.actionButtons[index] = button;
        }
    }
    static setupEventListeners() {
        if (this.eventListeners) {
            return;
        }
        this.eventListeners = {};
        this.eventListeners.mousedown = function (e) {
            if (!e.target.closest('.inventory-slot') && !e.target.closest('.action-button')) {
                this.hideActionContainer();
            }
        }.bind(this);

        this.eventListeners.inspectClick = function (e) {
            if (this.actionButtonAround) {
                this.actionButtonAround.inspectItem();
                this.hideActionContainer();
            }
        }.bind(this);

        this.eventListeners.trashClick = function (e) {
            if (this.actionButtonAround) {
                this.actionButtonAround.trashItem();
                this.hideActionContainer();
            }
        }.bind(this);

        document.addEventListener("mousedown", this.eventListeners.mousedown);
        this.actionButtons[this.ACTIONS.INSPECT].addEventListener("click", this.eventListeners.inspectClick);
        this.actionButtons[this.ACTIONS.TRASH].addEventListener("click", this.eventListeners.trashClick);

    }

    setupEventListeners() {
        if (this.eventListeners) {
            return;
        }
        this.eventListeners = {};
        this.eventListeners.scroll = function (e) {
            Inventory.hideActionContainer();
        }.bind(this);

        this.html.addEventListener("scroll", this.eventListeners.scroll);
    }

    destroy() {
        if (this.eventListeners) {
            this.html.removeEventListener("scroll", this.eventListeners.scroll);
        }
        this.modal.destroy();
        this.html.remove();
        this.eventListeners = null;
        for (var y = 0; y < this.rows; y++) {
            for (var x = 0; x < this.columns; x++) {
                var slot = this.getSlot(x, y);
                slot.destroy();
            }
        }
    }
}


export default Inventory;