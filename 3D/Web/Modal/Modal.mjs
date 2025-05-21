
const Modal = class {
    constructor(options) {
        this.draggable = options?.draggable ?? true;
        this.title = options?.title ?? null;
        this.closeable = options?.closeable ?? true;

        this.content = options?.content ?? null;
        this.html = null;

        this.modalContentElement = null;
        this.modalHeaderElement = null;
        this.modalTitleElement = null;
        this.modalCloseButtonElement = null;
        this.parent = null;
    }

    createHTML(options) {
        var container = options.container;
        this.parent = container;
        var document = options.document;
        var width = options?.width ?? 750;
        var height = options?.height ?? 600;

        this.html = document.createElement('div');
        this.html.classList.add('modal-container');
        this.html.style.width = `${width}px`;
        this.html.style.height = `${height}px`;

        this.modalHeaderElement = document.createElement("div");
        this.modalHeaderElement.classList.add("modal-header");
        if (this.draggable) {
            this.modalHeaderElement.style.cursor = "move";
        }
        this.html.appendChild(this.modalHeaderElement);


        this.modalCloseButtonElement = document.createElement("div");
        this.modalCloseButtonElement.classList.add("modal-close-button");

        this.modalHeaderElement.appendChild(this.modalCloseButtonElement);

        this.modalTitleElement = document.createElement("div");
        this.modalTitleElement.classList.add("modal-title");
        this.modalTitleElement.innerHTML = this.title;
        this.modalHeaderElement.appendChild(this.modalTitleElement);

        this.modalContentElement = document.createElement("div");
        this.modalContentElement.classList.add("modal-content");
        this.html.appendChild(this.modalContentElement);

        this.modalContentElement.appendChild(this.content);

        container.appendChild(this.html);

        this.setupEventListeners({
            document: document
        });

        return this.html;
    }

    center() {
        var parentRect = this.parent.getBoundingClientRect();
        var modalRect = this.html.getBoundingClientRect();

        var left = (parentRect.width - modalRect.width) / 2;
        var top = (parentRect.height - modalRect.height) / 2;

        this.html.style.left = `${left}px`;
        this.html.style.top = `${top}px`;
    }

    setupEventListeners({ document }) {
        if (this.draggable) {
            var isDragging = false;
            var offset = {
                x: 0,
                y: 0
            }
            this.modalHeaderElement.addEventListener("mousedown", function (e) {
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
                var parentRect = this.parent.getBoundingClientRect();
                var modalRect = this.html.getBoundingClientRect();

                var newLeft = e.clientX - offset.x;
                var newTop = e.clientY - offset.y;

                var minLeft = 0;
                var maxLeft = parentRect.width - modalRect.width;
                var minTop = 0;
                var maxTop = parentRect.height - modalRect.height;

                newLeft = Math.min(Math.max(newLeft, minLeft), maxLeft);
                newTop = Math.min(Math.max(newTop, minTop), maxTop);

                this.html.style.left = `${newLeft}px`;
                this.html.style.top = `${newTop}px`;
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
    }
}

export default Modal;