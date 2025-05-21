import InventorySlot from "./InventorySlot.mjs";
import Modal from "../Modal/Modal.mjs";

const Inventory = class {

    static actionButtonAround = null;
    static setEventListeners = false;
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
        this.document = options.document;
        this.slots = [];
        for (let i = 0; i < this.rows; i++) {
            this.slots[i] = [];
            for (let j = 0; j < this.columns; j++) {
                this.slots[i][j] = new InventorySlot({
                    document: this.document,
                    parent: this
                });
            }
        }

        this.modal = new Modal({
            draggable: true,
            closeable: false,
            title: "Inventory"
        })
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
            if (!Inventory.actionButtonAround.parent.html.contains(Inventory.actionContainer)) {
                Inventory.actionButtonAround.parent.html.appendChild(Inventory.actionContainer);
            }
        }
    }

    static isButtonClipped(button, direction = null) {
        if (!Inventory.actionButtonAround) {
            return false;
        }
        var elementRect = button.getBoundingClientRect();
        var containerRect = Inventory.actionButtonAround.parent.html.getBoundingClientRect();


        switch (direction) {
            case "right":
                return elementRect.right > containerRect.right;
            case "left":
                return elementRect.left < containerRect.left;
            case "bottom":
                return elementRect.bottom > containerRect.bottom;
            case "top":
                return elementRect.top < containerRect.top;
            default:
                return elementRect.right > containerRect.right || elementRect.left < containerRect.left || elementRect.bottom > containerRect.bottom || elementRect.top < containerRect.top;
        }
    }

    static centerActionButtonAround(slot) {
        Inventory.hideActionContainer();
        if (!slot.item) {
            return;
        }
        Inventory.actionButtonAround = slot;
        Inventory.showActionContainer();

        Inventory.actionContainer.style.left = `${slot.html.offsetLeft}px`;
        Inventory.actionContainer.style.top = `${slot.html.offsetTop}px`;
        Inventory.actionContainer.style.width = `${slot.html.offsetWidth}px`;
        Inventory.actionContainer.style.height = `${slot.html.offsetHeight}px`;

        for (var index = 0; index < Inventory.actionButtons.length; index++) {
            var button = Inventory.actionButtons[index];
            switch (index) {
                case this.ACTIONS.TRASH:
                    button.style.bottom = `calc(-10% - ${button.offsetWidth}px)`;
                    button.style.top = "unset";
                    button.style.left = "50%";
                    if(Inventory.isButtonClipped(button, "bottom")){
                        button.style.top = `calc(-10% - ${button.offsetWidth}px)`;
                        button.style.bottom = "unset";
                    }
                    break;
                case this.ACTIONS.INSPECT:
                    button.style.left = `calc(-10% - ${button.offsetWidth}px)`;
                    button.style.right = "unset";
                    button.style.top = "50%";
                    if(Inventory.isButtonClipped(button, "left")){
                        button.style.right = `calc(-10% - ${button.offsetWidth}px)`;
                        button.style.left = "unset";
                    }
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

        var inventoryContainer = this.document.createElement("div");
        inventoryContainer.classList.add("inventory-container");

        var element = this.document.createElement("div");

        element.classList.add("inventory-grid-container");
        element.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
        element.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        element.style.gap = gap;
        element.style.padding = gap;
        inventoryContainer.style.overflow = options.overflow ? "auto" : "hidden";

        for (var row = 0; row < this.rows; row++) {
            for (var column = 0; column < this.columns; column++) {
                var slot = this.getSlot(column, row);
                var slotElememt = slot.createHTML()
                element.appendChild(slotElememt);
            }
        }

        inventoryContainer.appendChild(element);
        this.html = inventoryContainer;

        Inventory.createHTML({
            document: this.document
        });

        Inventory.setupEventListeners({
            document: this.document
        });

        this.modal.content = this.html;
        this.modal.createHTML({
            document: this.document,
            container: container,
            width: width,
            height: height
        });

        if(options?.centered){
            this.modal.center();
        }

        return this.html;
    }

    update() {
        for (var row = 0; row < this.rows; row++) {
            for (var column = 0; column < this.columns; column++) {
                var slot = this.getSlot(column, row);
                slot.update();
            }
        }
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

    static createHTML({ document }) {
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
    static setupEventListeners({ document }) {
        if (this.setEventListeners) {
            return;
        }
        this.setEventListeners = true;
        document.addEventListener("click", function (e) {
            if (!e.target.closest('.inventory-slot') && !e.target.closest('.action-button')) {
                this.hideActionContainer();
            }
        }.bind(this));
    }
}


export default Inventory;