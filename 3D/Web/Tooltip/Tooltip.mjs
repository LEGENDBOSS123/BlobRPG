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
        this.addEventListener("mousemove", document, "mousemove",
            function (e) {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
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
        this.html.style.left = `${this.mouse.x}px`;
        this.html.style.top = `${this.mouse.y}px`;

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