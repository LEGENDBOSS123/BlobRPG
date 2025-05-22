
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

    headerVisible(){
        return this.title || this.closeable || this.draggable;
    }

    createHTML(options) {
        var container = options.container;
        this.parent = container;
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
        else{
            this.modalContentElement.classList.add('modal-no-header');
        }


        container.appendChild(this.html);

        this.setupEventListeners();

        if (options?.centered) {
            this.center();
        }

        return this.html;
    }


    setContent(content) {
        this.modalContentElement.innerHTML = '';
        this.modalContentElement.appendChild(content);
    }

    center() {
        var parentRect = this.parent.getBoundingClientRect();
        var modalRect = this.html.getBoundingClientRect();

        var left = (parentRect.width - modalRect.width) / 2;
        var top = (parentRect.height - modalRect.height) / 2;

        this.html.style.left = `${left}px`;
        this.html.style.top = `${top}px`;
    }

    open() {
        this.html.style.display = "block";
    }

    close() {
        this.html.style.display = "none";
    }

    toggleOpenClose(){
        this.html.style.display = this.html.style.display == "none" ? "block" : "none";
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
        if (this.draggable) {
            var isDragging = false;
            var offset = {
                x: 0,
                y: 0
            }
            this.modalHeaderElement.addEventListener("mousedown", function (e) {
                this.bringToFront();
                isDragging = true;
                var rect = this.html.getBoundingClientRect();
                offset.x = e.clientX - rect.left;
                offset.y = e.clientY - rect.top;

                document.addEventListener("mousemove", onMouseMove.bind(this));
                document.addEventListener("mouseup", onMouseUp.bind(this));

            }.bind(this));

            var onMouseMove = function (e) {
                if (!isDragging) {
                    return;
                }
                var newLeft = e.clientX - offset.x;
                var newTop = e.clientY - offset.y;

                this.html.style.left = `${newLeft}px`;
                this.html.style.top = `${newTop}px`;

                this.clampToParentBounds();

            }.bind(this);

            var onMouseUp = function (e) {
                if (!isDragging) {
                    return;
                }
                isDragging = false;
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            }.bind(this);
        }

        if (this.resizable && this.fullscreenable) {
            var previousWidth = this.html.style.width;
            var previousHeight = this.html.style.height;
            var previousPosition = {
                x: this.html.offsetLeft,
                y: this.html.offsetTop
            }
            this.modalHeaderElement.addEventListener("dblclick", function (e) {
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
            }.bind(this));
        }

        if(this.closeable){
            this.modalCloseButtonElement.addEventListener("click", function (e) {
                this.close();
            }.bind(this));
        }

        this.html.addEventListener("click", function (e) {
            this.bringToFront();
        }.bind(this));
    }
}

export default Modal;