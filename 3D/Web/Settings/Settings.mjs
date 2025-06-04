import WebComponent from "../WebComponent.mjs";
import Modal from "../Modal/Modal.mjs";
const SettingsComponent = class extends WebComponent {
    constructor(options) {
        super(options);
        this.components = [];
        this.html = null;
        this.parent = null;
        this.htmlOptions = options?.htmlOptions ?? {};
    }

    addComponent(c) {
        this.components.push(c);
        c.parent = this;
        c.gameEngine = this.gameEngine;
    }

    createHTML(options) {

    }

    destroy() {
        for (var component of this.components) {
            component.destroy();
        }
        super.destroy();
    }

    setContainer(container) {
        this.parent = container;
        container.appendChild(this.html);
    }
}

const Button = class extends SettingsComponent {
    constructor(options) {
        super(options);
    }

    createHTML(options) {
    }
}


const Panel = class extends SettingsComponent {
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

        this.contentElement = document.createElement("div");
        this.contentElement.classList.add("settings-panel-content");
        this.html.appendChild(this.contentElement);

        for (var buttonTitle in this.buttons) {
            var buttonElement = document.createElement("div");
            buttonElement.classList.add("settings-panel-button");
            var buttonLabel = document.createElement("span");
            buttonLabel.classList.add("settings-panel-button-label");
            buttonLabel.innerHTML = buttonTitle;

            this.panelElement.appendChild(buttonElement);

            buttonElement.appendChild(buttonLabel);

            this.buttonElements[buttonTitle] = {
                element: buttonElement,
                content: this.buttons[buttonTitle]
            };

            var buttonContent = this.buttonElements[buttonTitle].content;
            buttonContent.htmlOptions.container = this.contentElement;
            buttonContent.htmlOptions.text = buttonTitle;
            buttonContent.parent = this;
            buttonContent.createHTML(buttonContent.htmlOptions);
        }

        this.buttonElements[Object.keys(this.buttonElements)[0]].content.show();

        container.appendChild(this.html);

        this.setupEventListeners();
    }

    setupEventListeners() {
        for (const buttonTitle in this.buttonElements) {
            const button = this.buttonElements[buttonTitle];
            this.addEventListener(buttonTitle + "-click", button.element, "click",
                function (e) {
                    button.content.show();
                }
            )
        }
    }
}

const Screen = class extends SettingsComponent {
    constructor(options) {
        super(options);
        for (const e of options?.elements ?? []) {
            this.addComponent(e);
        }

    }

    createHTML(options) {
        const container = options.container;

        this.html = document.createElement("div");
        this.html.classList.add("settings-screen", "hidden");

        container.appendChild(this.html);
        for (const c of this.components) {
            c.htmlOptions.container = this.html;
            c.createHTML(c.htmlOptions);
        }
    }

    show() {
        for (const child of this.html.parentElement.children) {
            child.classList.add("hidden");
        }
        this.html.classList.remove("hidden");
    }

    hide() {

    }
}

const Checkbox = class extends SettingsComponent {
    constructor(options) {
        super(options);
        this.name = options?.title ?? "";
        this.label = options?.label ?? "";
        this.value = options?.value ?? false;

        this.checkboxElement = null;
        this.labelElement = null;
    }

    createHTML(options) {
        const container = options.container;

        this.html = document.createElement("div");
        this.html.classList.add("settings-screen-item-container", "checkbox");

        this.labelElement = document.createElement("label");
        this.labelElement.classList.add("label");
        this.labelElement.textContent = this.label;
        this.html.appendChild(this.labelElement);

        const switchWrapper = document.createElement("label");
        switchWrapper.classList.add("switch");

        this.checkboxElement = document.createElement("input");
        this.checkboxElement.type = "checkbox";

        const slider = document.createElement("span");
        slider.classList.add("slider");

        switchWrapper.appendChild(this.checkboxElement);
        switchWrapper.appendChild(slider);
        this.html.appendChild(switchWrapper);

        container.appendChild(this.html);
    }

}


const Slider = class extends SettingsComponent {
    constructor(options) {
        super(options);
        this.name = options?.title ?? "";
        this.label = options?.label ?? "";

        this.min = options?.min ?? 0;
        this.max = options?.max ?? 100;
        this.default = options?.default ?? 50;
        this.value = options?.value ?? this.default;
        this.decimalPlaces = options?.decimalPlaces ?? 0;
        this.sliderMax = Number("1" + "0".repeat(-1 + Math.max(Math.abs(this.min).toString().length, Math.abs(this.max).toString().length) + this.decimalPlaces));

        this.sliderElement = null;
        this.labelElement = null;
        this.valueElement = null;
    }

    getValue(){
        return (this.sliderElement.value * (this.max - this.min) / this.sliderMax + this.min).toFixed(this.decimalPlaces);
    }

    setValue(x){
        var constrained = Math.min(Math.max(x, this.min), this.max);
        if(!Number.isFinite(constrained)){
            constrained = this.default;
        }
        constrained = constrained.toFixed(this.decimalPlaces);
        this.sliderElement.value = (constrained - this.min) / (this.max - this.min) * this.sliderMax;
        this.valueElement.value = constrained;
    }

    createHTML(options) {
        const container = options.container;

        this.html = document.createElement("div");
        this.html.classList.add("settings-screen-item-container", "slider");

        this.labelParentElement = document.createElement("div");
        this.labelParentElement.classList.add("label-parent");

        this.labelElement = document.createElement("label");
        this.labelElement.classList.add("label");
        this.labelElement.textContent = this.label;
        this.labelParentElement.appendChild(this.labelElement);

        this.html.appendChild(this.labelParentElement);

        this.valueElement = document.createElement("input");
        this.valueElement.type = "text";
        this.valueElement.classList.add("value");
        
        this.sliderElement = document.createElement("input");
        this.sliderElement.type = "range";
        this.sliderElement.min = "0";
        this.sliderElement.max = this.sliderMax;
        this.setValue(this.value);
        this.sliderElement.classList.add("slider");

        

        this.html.appendChild(this.sliderElement);

        this.html.appendChild(this.valueElement);

        container.appendChild(this.html);

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener("slider-change", this.sliderElement, "input",
            function (e) {
                this.value = this.getValue();
                this.valueElement.value = this.value;
            }.bind(this)
        );
        this.addEventListener("value-change", this.valueElement, "change",
            function (e) {
                this.setValue(this.valueElement.value);
            }.bind(this)
        );
    }

}

const Settings = class extends Modal {

    static Button = Button;
    static Panel = Panel;
    static Screen = Screen;
    static Checkbox = Checkbox;
    static Slider = Slider;

    constructor(options) {
        super(options);
        this.components = [];
    }

    addComponent(c) {
        this.components.push(c);
        c.parent = this;
        c.gameEngine = this.gameEngine;
    }

    createHTML(options) {
        super.createHTML(options);
        for (var component of this.components) {
            component.htmlOptions.container = this.html;
            component.createHTML(component.htmlOptions);
        }
    }

    update() {
        super.update();
    }

    destroy() {
        for (var component of this.components) {
            component.destroy();
        }
        super.destroy();
    }
}

export default Settings;