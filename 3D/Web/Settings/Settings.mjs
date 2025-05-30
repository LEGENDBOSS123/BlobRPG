import WebComponent from "../WebComponent.mjs";
import Modal from "../Modal/Modal.mjs";
const SettingsComponent = class extends WebComponent {
    constructor(options) {
        super(options);
        this.components = [];
        this.html = null;
        this.parent = null;
    }

    addComponent(c) {
        this.components.push(c);
        c.parent = this;
    }

    createHTML(options) {

    }

    destroy() {
        for (var component of this.components) {
            component.destroy();
        }
        super.destroy();

    }
}

const SettingsButton = class extends SettingsComponent {
    constructor(options) {
        super(options);
    }

    createHTML(options) {

    }
}

const SettingsPanel = class extends SettingsComponent {
    constructor(options) {
        super(options);
        this.buttons = options?.buttons ?? [];
        this.buttonElements = [];
        this.contentElement = null;
        this.panelElement = null;
    }

    createHTML(options) {
        const container = this.parent.modalContentElement;

        const width = options?.width ?? 60;
        const height = options?.height ?? 60;
        const side = options?.side ?? "left";

        this.html = document.createElement("div");
        this.html.classList.add("settings-panel-container");


        this.panelElement = document.createElement("div");
        this.panelElement.classList.add("settings-panel", side);
        this.html.appendChild(this.panelElement);

        
        for (var button of this.buttons) {
            var buttonElement = document.createElement("div");
            buttonElement.classList.add("settings-panel-button");
            var buttonLabelElement = document.createElement("span");
            buttonLabelElement.classList.add("settings-panel-button-label");
            buttonLabelElement.innerHTML = button;

            this.panelElement.appendChild(buttonElement);
            this.buttonElements.push(buttonElement);
            buttonElement.appendChild(buttonLabelElement);
        }

        this.contentElement = document.createElement("div");
        this.contentElement.classList.add("settings-panel-content");
        this.html.appendChild(this.contentElement);

        container.appendChild(this.html);
    }

    setupEventListeners() {
        for (var button of this.buttons) {
            var f = function () {
                this.parent.modal.hide();
            }.bind(this);
            this.addEventListener("click", button, "click", f);
        }
    }
}

const Settings = class extends Modal {

    static SettingsButton = SettingsButton;
    static SettingsPanel = SettingsPanel;

    constructor(options) {
        super(options);
        this.components = [];
    }

    addComponent(c) {
        this.components.push(c);
        c.parent = this;
    }

    createHTML(options) {
        super.createHTML(options);
    }
}

export default Settings;