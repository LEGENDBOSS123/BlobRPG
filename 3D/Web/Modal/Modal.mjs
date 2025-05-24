
const Modal = class {

    static zIndexCounter = 1000;

    constructor(options) {
        this.draggable = options?.draggable ?? true;
        this.title = options?.title ?? null;
        this.closeable = options?.closeable ?? true;
        this.resizable = options?.resizable ?? true;
        this.fullscreenable = options?.fullscreenable ?? true;
        this.content = options?.content ?? null;
        this.html = null;

        this.modalContentElement = null;
        this.modalHeaderElement = null;
        this.modalTitleElement = null;
        this.modalCloseButtonElement = null;
        this.parent = null;
    }

    bringToFront() {
        Modal.zIndexCounter++;
        this.html.style.zIndex = Modal.zIndexCounter;
    }

    headerVisible() {
        return this.title || this.closeable || this.draggable;
    }

    setContainer(container) {
        this.parent = container;
        container.appendChild(this.html);
    }

    createHTML(options) {
        var container = options.container;
        var width = options?.width ?? 750;
        var height = options?.height ?? 600;

        this.html = document.createElement('div');
        this.html.classList.add('modal-container');
        this.html.style.width = `${width}px`;
        this.html.style.height = `${height}px`;
        if (this.resizable) {
            this.html.classList.add('modal-resizable');
        }

        this.modalContentElement = document.createElement("div");
        this.modalContentElement.classList.add("modal-content");
        this.html.appendChild(this.modalContentElement);

        if (this.content) {
            this.setContent(this.content);
        }

        if (this.headerVisible()) {
            this.modalHeaderElement = document.createElement("div");
            this.modalHeaderElement.classList.add("modal-header");
            if (this.draggable) {
                this.modalHeaderElement.style.cursor = "move";
            }
            this.html.appendChild(this.modalHeaderElement);
            this.modalCloseButtonElement = document.createElement("div");
            this.modalCloseButtonElement.classList.add("modal-close-button");
            if (!this.closeable) {
                this.modalCloseButtonElement.classList.add('modal-hidden');
            }
            this.modalHeaderElement.appendChild(this.modalCloseButtonElement);

            this.modalTitleElement = document.createElement("div");
            this.modalTitleElement.classList.add("modal-title");
            this.modalTitleElement.innerHTML = this.title;
            this.modalHeaderElement.appendChild(this.modalTitleElement);
        }
        else {
            this.modalContentElement.classList.add('modal-no-header');
        }

        if (container) {
            this.setContainer(container);
        }

        this.setupEventListeners();

        if (options?.centered) {
            this.center();
        }

        return this.html;
    }

    static isChildClipped(child, parent, direction = null, threshold = 0) {
        const elementRect = child.getBoundingClientRect();
        const containerRect = parent.getBoundingClientRect();

        switch (direction) {
            case "right":
                return elementRect.right > containerRect.right + threshold;
            case "left":
                return elementRect.left < containerRect.left - threshold;
            case "bottom":
                return elementRect.bottom > containerRect.bottom + threshold;
            case "top":
                return elementRect.top < containerRect.top - threshold;
            default:
                return (
                    elementRect.right > containerRect.right + threshold ||
                    elementRect.left < containerRect.left - threshold ||
                    elementRect.bottom > containerRect.bottom + threshold ||
                    elementRect.top < containerRect.top - threshold
                );
        }
    }


    setContent(content) {
        this.modalContentElement.innerHTML = '';
        if (content) {
            this.modalContentElement.appendChild(content);
        }
    }

    center() {
        var parentRect = this.parent.getBoundingClientRect();
        var modalRect = this.html.getBoundingClientRect();

        var left = (parentRect.width - modalRect.width) / 2;
        var top = (parentRect.height - modalRect.height) / 2;

        this.html.style.left = `${left}px`;
        this.html.style.top = `${top}px`;
    }

    isClosed(){
        return !this.parent.contains(this.html);
    }

    isHidden(){
        return this.html.classList.contains('modal-hidden');
    }

    isVisible(){
        return !this.isHidden() && !this.isClosed();
    }

    open() {
        this.parent.appendChild(this.html);
    }

    close() {
        this.html.remove();
    }

    remove() {
        this.html.remove();
    }

    hide() {
        this.html.classList.add('modal-hidden');
    }

    show() {
        this.html.classList.remove('modal-hidden');
    }

    addBack() {
        this.parent.appendChild(this.html);
    }

    toggleOpenClose() {
        if (this.parent.contains(this.html)) {
            this.remove();
        }
        else {
            this.parent.appendChild(this.html);
        }
    }

    static clampToParentBounds(html, parent) {
        if (!parent || !html) {
            return;
        }

        const parentRect = parent.getBoundingClientRect();
        const modalRect = html.getBoundingClientRect();

        var left = parseFloat(html.style.left || '0');
        var top = parseFloat(html.style.top || '0');

        const maxLeft = parentRect.width - modalRect.width;
        const maxTop = parentRect.height - modalRect.height;

        left = Math.min(Math.max(0, left), maxLeft);
        top = Math.min(Math.max(0, top), maxTop);

        html.style.left = `${left}px`;
        html.style.top = `${top}px`;
        html.style.right = "";
        html.style.bottom = "";
    }


    clampToParentBounds() {
        Modal.clampToParentBounds(this.html, this.parent);
    }

    update() {
        this.clampToParentBounds();
    }

    setupEventListeners() {
        if (this.eventListeners) {
            return;
        }

        this.eventListeners = {};

        if (this.draggable) {
            var isDragging = false;
            var offset = {
                x: 0,
                y: 0
            }
            this.eventListeners.mousedownDrag = function (e) {
                this.bringToFront();
                isDragging = true;
                var rect = this.html.getBoundingClientRect();
                offset.x = e.clientX - rect.left;
                offset.y = e.clientY - rect.top;

                document.addEventListener("mousemove", this.eventListeners.onmousemoveDrag);
                document.addEventListener("mouseup", this.eventListeners.onmouseupDrag);
            }.bind(this)
            this.modalHeaderElement.addEventListener("mousedown", this.eventListeners.mousedownDrag);

            this.eventListeners.onmousemoveDrag = function (e) {
                if (!isDragging) {
                    return;
                }
                var newLeft = e.clientX - offset.x;
                var newTop = e.clientY - offset.y;

                this.html.style.left = `${newLeft}px`;
                this.html.style.top = `${newTop}px`;

                this.clampToParentBounds();
            }.bind(this);

            this.eventListeners.onmouseupDrag = function (e) {
                if (!isDragging) {
                    return;
                }
                isDragging = false;
                document.removeEventListener("mousemove", this.eventListeners.onmousemoveDrag);
                document.removeEventListener("mouseup", this.eventListeners.onmouseupDrag);
            }.bind(this);
        }

        if (this.resizable && this.fullscreenable) {
            var previousWidth = this.html.style.width;
            var previousHeight = this.html.style.height;
            var previousPosition = {
                x: this.html.offsetLeft,
                y: this.html.offsetTop
            }
            this.eventListeners.dblclick = function (e) {
                if (this.html.classList.contains("modal-fullscreen")) {
                    this.html.style.width = previousWidth;
                    this.html.style.height = previousHeight;
                    this.html.style.left = `${previousPosition.x}px`;
                    this.html.style.top = `${previousPosition.y}px`;
                    this.html.classList.remove("modal-fullscreen");
                    this.clampToParentBounds();
                }
                else {
                    previousPosition.x = this.html.offsetLeft;
                    previousPosition.y = this.html.offsetTop;
                    this.html.style.width = "";
                    this.html.style.height = "";
                    this.html.classList.add("modal-fullscreen");
                    this.clampToParentBounds();
                }
            }.bind(this);
            this.modalHeaderElement.addEventListener("dblclick", this.eventListeners.dblclick);
        }

        if (this.closeable) {
            this.eventListeners.clickClose = function (e) {
                this.close();
            }.bind(this);
            this.modalCloseButtonElement.addEventListener("click", this.eventListeners.clickClose);
        }

        this.eventListeners.onmousedown = function (e) {
            this.bringToFront();
        }.bind(this);

        this.html.addEventListener("mousedown", this.eventListeners.onmousedown);
    }

    destroy() {
        if (this.eventListeners) {
            this.modalHeaderElement?.removeEventListener("mousedown", this.eventListeners.mousedownDrag);
            document.removeEventListener("mousemove", this.eventListeners.onmousemoveDrag);
            document.removeEventListener("mouseup", this.eventListeners.onmouseupDrag);
            this.modalHeaderElement?.removeEventListener("dblclick", this.eventListeners.dblclick);
            this.modalCloseButtonElement?.removeEventListener("click", this.eventListeners.clickClose);
            this.html.removeEventListener("mousedown", this.eventListeners.onmousedown);
        }

        if (this.html && this.html.parentNode) {
            this.html.remove();
        }
        this.html = null;
        this.modalContentElement = null;
        this.modalHeaderElement = null;
        this.modalTitleElement = null;
        this.modalCloseButtonElement = null;
        this.parent = null;
        this.content = null;
        this.eventListeners = null;
    }
}

export default Modal;