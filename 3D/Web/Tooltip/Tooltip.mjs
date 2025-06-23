import Modal from "../Modal/Modal.mjs";

const Tooltip = class extends Modal {
    constructor(options) {
        super(options);
        this.draggable = false;
        this.closeable = false;
        this.resizable = false;
        this.fullscreenable = false;
        this.target = null;
        this.mouse = {
            x: 0,
            y: 0
        }
    }
    createHTML(options) {
        super.createHTML(options);
        this.html.classList.add("tooltip");
        this.modalContentElement.classList.add("tooltip-content");
        this.html.style.width = "auto";
        this.html.style.height = "auto";
        this.hideToolTip();
    }

    setupEventListeners() {
        super.setupEventListeners();
        this.addEventListener("pointermove", document, "pointermove",
            function (e) {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }.bind(this)
        );
        this.addEventListener("drag", document, "drag",
            function (e) {
                this.mouse.x = null;
                this.mouse.y = null;
            }.bind(this)
        );
    }

    hideToolTip() {
        super.hide();
        this.target = null;
    }

    showToolTip() {
        this.bringToFront();
        super.show();
    }

    update() {
        if(!Number.isFinite(this.mouse.x) || !Number.isFinite(this.mouse.y)){
            this.hideToolTip();
            return;
        }
        this.html.style.left = `${this.mouse.x + 8}px`;
        this.html.style.top = `${this.mouse.y + 8}px`;

        const hoveringElement = document.elementFromPoint(this.mouse.x, this.mouse.y);
        if (hoveringElement?.dataset?.tooltipHTML) {
            if (this.target != hoveringElement) {
                this.showToolTip();
            }
            if(!this.isInFront()){
                this.bringToFront();
            }
            this.target = hoveringElement;
            this.modalContentElement.innerHTML = hoveringElement.dataset.tooltipHTML;
        }
        else {
            this.hideToolTip();
        }
    }
};

export default Tooltip;