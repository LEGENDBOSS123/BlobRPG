
import WebComponent from "../WebComponent.mjs";


const Toast = class extends WebComponent {
    static get observedAttributes() {
        return ["message", "duration", "type", "closable"];
    }

    static TYPES = {
        SUCCESS: 0,
        ERROR: 1,
        INFO: 2,
        WARNING: 3,
        DEFAULT: 4
    };

    static SVG = {
        0: `<svg class="toast-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#FFFFFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>`,
        1: `<svg class="toast-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#FFFFFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>`,
        2: `<svg class="toast-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#FFFFFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>`,
        3: `<svg class="toast-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#FFFFFF" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V9h2v5z"/>
    </svg>`,
        4: `<svg class="toast-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#FFFFFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>`,
    };


    constructor(options) {
        super(options);
        this.message = options?.message ?? "";
        this.duration = options?.duration ?? 3000;
        this.type = options?.type ?? Toast.TYPES.DEFAULT;
        this.closable = options?.closable ?? true;
        this.html = null;
        this.iconElement = null;
        this.textElement = null;
        this.timeoutID = null;
    }

    createHTML(options) {
        this.html = document.createElement("div");
        this.html.classList.add("toast", "toast-start");

        switch (this.type) {
            case Toast.TYPES.SUCCESS:
                this.html.classList.add("success");
                break;
            case Toast.TYPES.ERROR:
                this.html.classList.add("error");
                break;
            case Toast.TYPES.INFO:
                this.html.classList.add("info");
                break;
            case Toast.TYPES.WARNING:
                this.html.classList.add("warning");
                break;
            case Toast.TYPES.DEFAULT:
                this.html.classList.add("default");
                break;
        }

        this.gameEngine.soundManager.play("toast");

        this.iconElement = document.createElement("div");
        this.iconElement.classList.add("toast-icon");
        var svg = document.createElement("svg");
        svg.innerHTML = Toast.SVG[this.type];
        svg.classList.add("toast-icon-svg");
        this.iconElement.appendChild(svg);
        this.html.appendChild(this.iconElement);

        this.textElement = document.createElement("span");
        this.textElement.classList.add("toast-text");
        this.textElement.innerHTML = this.message;
        this.html.appendChild(this.textElement);


        this.setupTimeout();
        return this.html;
    }

    startEndAnimation() {
        this.html.classList.add("toast-end");
        this.html.addEventListener("animationend", function () {
            this.html.remove();
        }.bind(this));
    }

    setupTimeout() {
        this.timeoutID = setTimeout(function () {
            this.startEndAnimation();
        }.bind(this), this.duration);
    }

    endEarly() {
        clearTimeout(this.timeoutID);
        this.startEndAnimation();
    }
}

export default Toast;