import InventorySlot from "./InventorySlot.mjs";
import Modal from "../Modal/Modal.mjs";

const Inventory = class {

    static actionButtonAround = null;
    static eventListeners = null;
    static actionContainer = null;
    static actionButtons = [];
    static actionButtonSize = 50;

    static toolTipAround = null;
    static toolTip = null;


    static ACTIONS = {
        TRASH: 0,
        INSPECT: 1,
        SPLIT: 2
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

    static showToolTip() {
        if (Inventory.toolTipAround) {
            Inventory.toolTip.html.style.zIndex = Number(Inventory.toolTipAround.parent.modal.html.style.zIndex) + 1;
            Inventory.toolTip.show();
        }
    }

    static hideToolTip() {
        if (Inventory.toolTipAround) {
            Inventory.toolTip.hide();
            Inventory.toolTipAround = null;
        }
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
            Inventory.actionContainer.style.zIndex = Number(Inventory.actionButtonAround.parent.modal.html.style.zIndex) + 2;
        }
    }

    static centerToolTipAround(slot) {
        Inventory.hideToolTip();
        if (!slot.item) {
            return;
        }
        Inventory.toolTipAround = slot;
        Inventory.showToolTip();
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
            var hide = false;
            switch (index) {
                case this.ACTIONS.TRASH:
                    if(!slot.isTrashable()) {
                        hide = true;
                    }
                    button.style.top = `calc(-10% - ${button.offsetWidth}px)`;
                    button.style.bottom = "";
                    button.style.left = "50%";
                    break;
                case this.ACTIONS.INSPECT:
                    if(!slot.isInspectable()) {
                        hide = true;
                    }
                    button.style.left = `calc(-10% - ${button.offsetWidth}px)`;
                    button.style.right = "";
                    button.style.top = "50%";
                    break;
                case this.ACTIONS.SPLIT:
                    if(!slot.isSplittable()) {
                        hide = true;
                    }
                    button.style.right = `calc(-10% - ${button.offsetWidth}px)`;
                    button.style.left = "";
                    button.style.top = "50%";
                    break;
                default:
                    break;
            }
            if(hide){
                button.style.display = "none";
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
            if (!this.modal.isVisible()) {
                Inventory.hideActionContainer();
            }
        }

        if (Inventory.toolTipAround && Inventory.toolTipAround.parent == this) {
            Inventory.centerToolTipAround(Inventory.toolTipAround);
            if (!this.modal.isVisible()) {
                Inventory.hideToolTip();
            }
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
                case this.ACTIONS.SPLIT:
                    button.innerHTML = '🔀';
                    button.style.transform = "translateY(-50%)";
                    break
                default:
                    break;
            }

            this.actionContainer.appendChild(button);
            this.actionButtons[index] = button;
            document.body.appendChild(this.actionContainer);
            this.actionContainer.style.display = 'none';
        }

        this.toolTip = new Modal({
            draggable: false,
            closeable: false,
            resizable: false,
            fullscreenable: false
        })
        this.toolTip.createHTML({
            container: document.body,
            width: 120,
            height: 90
        });
        this.toolTip.html.classList.add('inventory-tooltip');   
        this.toolTip.hide();
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
            this.eventListeners.mousemove(e);
        }.bind(this);

        this.eventListeners.mousemove = function (e) {
            if (this.toolTipAround && this.toolTipAround) {
                this.toolTip.html.style.left = `${e.clientX}px`;
                this.toolTip.html.style.top = `${e.clientY}px`;
                if (!this.toolTipAround.parent.modal.isVisible()) {
                    this.hideToolTip();
                }
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

        this.eventListeners.splitClick = function (e) {
            if (this.actionButtonAround) {
                this.actionButtonAround.splitItem();
                this.hideActionContainer();
            }
        }.bind(this);

        document.addEventListener("mousedown", this.eventListeners.mousedown);
        document.addEventListener("mousemove", this.eventListeners.mousemove);
        this.actionButtons[this.ACTIONS.INSPECT].addEventListener("click", this.eventListeners.inspectClick);
        this.actionButtons[this.ACTIONS.TRASH].addEventListener("click", this.eventListeners.trashClick);
        this.actionButtons[this.ACTIONS.SPLIT].addEventListener("click", this.eventListeners.splitClick);

    }

    setupEventListeners() {
        if (this.eventListeners) {
            return;
        }
        this.eventListeners = {};
        this.eventListeners.scroll = function (e) {
            if (Inventory.actionButtonAround) {
                if (Modal.isChildClipped(Inventory.actionContainer, Inventory.actionButtonAround.parent.html, null, 1)) {
                    Inventory.hideActionContainer();
                }
            }
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