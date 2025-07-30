import WebComponent from "../WebComponent.mjs";
import Toast from "../Toast/Toast.mjs";
import Modal from "../Modal/Modal.mjs";
const SettingsComponent = class extends WebComponent {
    constructor(options) {
        super(options);
        this.components = [];
        this.parent = null;
        this.root = null;
        this.name = options?.name ?? "";
        this.htmlOptions = options?.htmlOptions ?? {};
    }

    addComponent(c) {
        this.components.push(c);
        c.parent = this;
    }

    setRoot(r) {
        this.root = r;
        for (const component of this.components) {
            component.setRoot(r);
        }
    }

    setState(state) {
        for (const component of this.components) {
            if (state.hasOwnProperty(component.name)) {
                component.setValue(state[component.name]);
            }
            component.setState(state);
        }
    }

    createHTML(options) {

    }

    setValue(x) {

    }

    getValue() {
        return 0;
    }

    changed(value) {
        if (this.name) {
            this.root.changedSetting(this.name, value);
        }
    }

    destroy() {
        for (const component of this.components) {
            component.destroy();
        }
        super.destroy();
    }

    setContainer(container) {
        this.parent = container;
        container.appendChild(this.html);
    }

    getState(state = {}) {
        for (const component of this.components) {
            if (component.name) {
                state[component.name] = component.getValue();
            }
            component.getState(state);
        }
        return state;
    }
};


const Panel = class extends SettingsComponent {
    constructor(options) {
        super(options);
        this.buttons = options?.buttons ?? [];
        for (const buttonTitle in this.buttons) {
            this.addComponent(this.buttons[buttonTitle]);
        }
        this.buttonElements = [];
        this.contentElement = null;
        this.panelElement = null;
    }

    createHTML(options) {
        const container = options.container;

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

        const firstButton = this.buttonElements[Object.keys(this.buttonElements)[0]];
        firstButton.content.show();
        firstButton.element.classList.add("selected");

        container.appendChild(this.html);

        this.setupEventListeners();
    }

    setupEventListeners() {
        for (const buttonTitle in this.buttonElements) {
            const button = this.buttonElements[buttonTitle];
            this.addDOMEventListener(buttonTitle + "-click", button.element, "click",
                function (e) {
                    button.content.show();
                    for(const b in this.buttonElements){
                        this.buttonElements[b].element.classList.remove("selected");
                    }
                    button.element.classList.add("selected");
                }.bind(this)
            )
        }
    }
};

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
};

const Checkbox = class extends SettingsComponent {
    constructor(options) {
        super(options);
        this.label = options?.label ?? "";
        this.default = options?.default ?? false;
        this.value = options?.value ?? this.default;

        this.checkboxElement = null;
        this.labelElement = null;
    }

    getValue() {
        return this.checkboxElement.checked;
    }

    setValue(x) {
        this.checkboxElement.checked = x;
        this.value = x;
        this.changed(this.value);
    }

    createHTML(options) {
        const container = options.container;

        this.html = document.createElement("div");
        this.html.classList.add("settings-screen-item-container", "checkbox");

        this.labelElement = document.createElement("span");
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

        this.setValue(this.value);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addDOMEventListener("checkbox-change", this.html, "change",
            function (e) {
                this.setValue(this.getValue());
            }.bind(this)
        );
        this.addDOMEventListener("checkbox-keydown", this.checkboxElement, "keydown",
            function (e) {
                this.checkboxElement.blur();
            }.bind(this)
        );
    }

};


const Slider = class extends SettingsComponent {
    constructor(options) {
        super(options);
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

    getValue() {
        return Number((this.sliderElement.value * (this.max - this.min) / this.sliderMax + this.min).toFixed(this.decimalPlaces));
    }

    setValue(x) {
        var constrained = Math.min(Math.max(x, this.min), this.max);
        if (!Number.isFinite(constrained)) {
            constrained = this.default;
        }
        constrained = constrained.toFixed(this.decimalPlaces);
        this.sliderElement.value = (constrained - this.min) / (this.max - this.min) * this.sliderMax;
        this.valueElement.value = constrained;
        this.value = constrained;
        this.changed(this.value);
    }

    createHTML(options) {
        const container = options.container;

        this.html = document.createElement("div");
        this.html.classList.add("settings-screen-item-container", "slider");

        this.labelParentElement = document.createElement("div");
        this.labelParentElement.classList.add("label-parent");

        this.labelElement = document.createElement("span");
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
        this.addDOMEventListener("slider-change", this.sliderElement, "input",
            function (e) {
                this.setValue(this.getValue());
            }.bind(this)
        );
        this.addDOMEventListener("value-change", this.valueElement, "change",
            function (e) {
                this.setValue(this.valueElement.value);
            }.bind(this)
        );
        this.addDOMEventListener("value-keydown", this.valueElement, "keydown",
            function (e) {
                e.stopImmediatePropagation();
            }.bind(this), true
        );
    }
};

const KeybindMenu = class extends SettingsComponent {
    constructor(options) {
        super(options);
        this.actions = [];
        this.keybinds = options.keybinds;
        if (Object.keys(this.keybinds).length > 0) {
            this.setKeybindsFromCameraControlsFormat(this.keybinds);
            for (const action in this.keybinds) {
                this.addComponent(
                    new Keybind({
                        action: action,
                        keys: this.keybinds[action]
                    })
                );
            }
        }
    }

    getValue() {
        this.updateValue();
        return this.keybinds;
    }

    setKeybindsFromCameraControlsFormat(keybinds) {
        const tmpKeyBind = {};

        for (const key in keybinds) {
            const action = keybinds[key];
            if (!this.actions.includes(action)) {
                this.actions.push(action);
            }

            if (!tmpKeyBind[action]) {
                tmpKeyBind[action] = [];
            }

            tmpKeyBind[action].push(key);
        }

        this.keybinds = tmpKeyBind;
    }

    static toCameraControlsFormat(keybinds) {
        const tmpKeyBind = {};

        for (const action in keybinds) {
            for (const key of keybinds[action]) {
                tmpKeyBind[key] = action;
            }
        }

        return tmpKeyBind;
    }

    updateValue() {
        const keybinds = {};
        for (const c of this.components) {
            for (const key of c.keys) {
                keybinds[key] = c.action;
            }
        }
        this.setKeybindsFromCameraControlsFormat(keybinds);
        this.changed(this.keybinds);
    }

    setValue(x) {
        this.keybinds = x;
        for (const c of this.components) {
            c.keys = this.keybinds[c.action];
            c.makeKeys();
        }
        this.changed(this.keybinds);
    }

    createHTML(options) {
        const container = options.container;

        this.html = document.createElement("div");
        this.html.classList.add("keybind-menu");

        for (const c of this.components) {
            c.htmlOptions.container = this.html;
            c.parent = this;
            c.createHTML(c.htmlOptions);
        }

        container.appendChild(this.html);
    }
};

const Keybind = class extends SettingsComponent {
    static onListenCallback = null;
    static settedEventListeners = false;
    static keyLabelMap = {
        "ArrowUp": "↑",
        "ArrowDown": "↓",
        "ArrowLeft": "←",
        "ArrowRight": "→",
        "Space": "⎵",
        "ShiftLeft": "L⇧",
        "ShiftRight": "R⇧"
    };

    constructor(options) {
        super(options);
        this.action = options?.action ?? "";
        this.keys = options?.keys ?? [];

        this.addButton = null;
        this.addButtonLabelElement = null;
        this.labelElement = null;
        this.keysContainer = null;
        this.keyElements = [];
        this.keyEventListenerIndex = 0;
    }

    camelCaseToWords(str) {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); });
    }


    getSymbol(key) {
        if (key.startsWith("Key")) {
            return key.substring(3).toUpperCase();
        }
        if (key.startsWith("Digit")) {
            return key.substring(5);
        }
        return Keybind.keyLabelMap[key];
    }

    makeKeys() {
        for (const key of this.keyElements) {
            this.removeDOMEventListener(key.eventListenerName);
            key.remove();
        }
        this.keyElements = [];
        for (const key of this.keys) {
            const keyElement = document.createElement("div");
            keyElement.classList.add("key");

            const keyLabel = document.createElement("span");
            keyLabel.classList.add("label");
            keyLabel.textContent = this.getSymbol(key);
            keyElement.appendChild(keyLabel);

            const deleteKey = document.createElement("span");
            deleteKey.classList.add("delete");
            keyElement.appendChild(deleteKey);

            this.keysContainer.appendChild(keyElement);
            this.keyElements.push(keyElement);

            const eventListenerName = "key-delete" + this.keyEventListenerIndex;
            keyElement.eventListenerName = eventListenerName;
            this.keyEventListenerIndex++;
            this.addDOMEventListener(eventListenerName, deleteKey, "click",
                function (e) {
                    if (this.keys.length <= 1) {
                        this.root.gameEngine.toastManager.createToast({
                            duration: 1000,
                            type: Toast.TYPES.ERROR,
                            message: "At least one key is required"
                        });
                        return;
                    }
                    this.removeDOMEventListener(eventListenerName);
                    keyElement.remove();
                    this.keys.splice(this.keys.indexOf(key), 1);
                    this.parent.updateValue();
                }.bind(this)
            );
        }
    }

    createHTML(options) {
        const container = options.container;

        this.html = document.createElement("div");
        this.html.classList.add("settings-screen-item-container", "keybind", "keybind-container");

        this.labelElement = document.createElement("span");
        this.labelElement.classList.add("label");
        this.labelElement.textContent = this.camelCaseToWords(this.action);
        this.html.appendChild(this.labelElement);


        this.keysContainer = document.createElement("div");
        this.keysContainer.classList.add("keys-container");
        this.html.appendChild(this.keysContainer);


        this.makeKeys();

        this.addButton = document.createElement("button");
        this.addButton.classList.add("add");

        this.html.appendChild(this.addButton);


        this.addButtonLabelElement = document.createElement("span");
        this.addButtonLabelElement.classList.add("label");
        this.addButtonLabelElement.textContent = "+";
        this.addButton.appendChild(this.addButtonLabelElement);

        container.appendChild(this.html);
        Keybind.setupEventListeners();
        this.setupEventListeners();
    }

    static setupEventListeners() {
        if (this.settedEventListeners) {
            return;
        }
        this.settedEventListeners = true;
        document.addEventListener("keydown", function (e) {
            if (Keybind.onListenCallback) {
                Keybind.onListenCallback(e.code);
                e.stopImmediatePropagation();
            }
        }, true);
    }

    setupEventListeners() {
        this.addDOMEventListener("button-click", this.addButton, "click",
            function (e) {
                this.addButton.blur();
                if (Keybind.onListenCallback) {
                    Keybind.onListenCallback(false);
                }
                this.addButtonLabelElement.textContent = "...";
                Keybind.onListenCallback = function (key) {
                    this.addButtonLabelElement.textContent = "+";
                    Keybind.onListenCallback = null;
                    if (!key || !this.getSymbol(key)) {
                        return;
                    }
                    if (this.keys.includes(key)) {
                        return this.root.gameEngine.toastManager.createToast({
                            duration: 1000,
                            type: Toast.TYPES.ERROR,
                            message: "This key is already in use"
                        });
                    }
                    this.keys.push(key);
                    this.makeKeys();
                    this.parent.updateValue();
                }.bind(this);

            }.bind(this)
        )

    }
}

const Settings = class extends Modal {

    static Panel = Panel;
    static Screen = Screen;
    static Checkbox = Checkbox;
    static Slider = Slider;
    static KeybindMenu = KeybindMenu;
    static Keybind = Keybind;

    constructor(options) {
        super(options);
        this.components = [];
        this.onChangeCallbacks = {};
        this.state = {};
    }

    addComponent(c) {
        this.components.push(c);
        c.parent = this;
    }

    createHTML(options) {
        super.createHTML(options);
        this.setRoot();
        for (var component of this.components) {
            component.htmlOptions.container = this.modalContentElement;
            component.createHTML(component.htmlOptions);
        }
    }

    load() {
        var state = localStorage.getItem("settings");
        if (state) {
            this.state = JSON.parse(state);
            this.setState(this.state);
        }
    }

    setState(state) {
        for (const component of this.components) {
            if (state.hasOwnProperty(component.name)) {
                component.setValue(state[component.name]);
            }
            component.setState(state);
        }
    }

    save() {
        var state = this.getState();
        localStorage.setItem("settings", JSON.stringify(state));
    }

    update() {
        super.update();
    }

    destroy() {
        for (const component of this.components) {
            component.destroy();
        }
        super.destroy();
    }

    getState(state = {}) {
        for (const component of this.components) {
            if (component.name) {
                state[component.name] = component.getValue();
            }
            component.getState(state);
        }
        this.state = state;
        return state;
    }

    changedSetting(name, value) {
        for (const f of this.onChangeCallbacks[name] ?? []) {
            f(value);
        }
    }

    onSettingsChange(name, f) {
        if (!this.onChangeCallbacks[name]) {
            this.onChangeCallbacks[name] = [];
        }
        this.onChangeCallbacks[name].push(f);
    }

    setRoot() {
        for (const component of this.components) {
            component.setRoot(this);
        }
    }
};

export default Settings;