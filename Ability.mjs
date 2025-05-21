var Ability = class {
    constructor(options) {
        this.name = options?.name ?? "ABILITY";
        this.holdTimeStamp = options?.holdTimeStamp ?? 0;
        this.holding = options?.holding ?? false;
        this.holdingTimeoutID = options?.holdingIntervalID ?? null;
        this.maxHoldTime = options?.maxHoldTime ?? 0;


        this.document = options.document;
        this.graphicsEngine = options.graphicsEngine;
        this.world = options.world;
        this.reloadTime = options?.reloadTime ?? 0;
        this.lastUsedTime = options?.lastUsedTime ?? 0;

        this.graphicsEngine.canvas.addEventListener("mousedown", this._onMouseDown.bind(this));
        this.graphicsEngine.canvas.addEventListener("mouseup", this._onMouseUp.bind(this));

        this.html = null;
        this.createHTML();
        this.active = false;
    }

    _onMouseDown() {
        if (!this.active || this.holding || this.lastUsedTime + this.reloadTime > performance.now()) {
            return;
        }
        this.holdTimeStamp = performance.now();
        this.holding = true;
        this.holdingTimeoutID = setTimeout(function () {
            this._activate(this.maxHoldTime);
        }.bind(this), this.maxHoldTime);
    }

    _onMouseUp() {
        if (!this.holding || this.lastUsedTime + this.reloadTime > performance.now()) {
            return;
        }
        clearTimeout(this.holdingTimeoutID);
        this._activate(performance.now() - this.holdTimeStamp);
    }

    _activate(timeHeld) {
        if (!this.active) {
            return;
        }
        this.holding = false;
        this.onActivate(timeHeld);
        this.lastUsedTime = performance.now();
    }

    onActivate(timeHeld) {
        console.log("Ability Activated for " + timeHeld + "ms.");
    }

    createHTML() {
        var container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.position = 'absolute';
        container.style.bottom = "0";
        container.textContent = this.name;
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        
        this.html = container;
        return container;
    }

    update() {
        var ratio = 1;
        if (this.holding) {
            ratio = (performance.now() - this.holdTimeStamp) / this.maxHoldTime;
            this.html.style.backgroundColor = 'red';
        }
        else {
            ratio = (performance.now() - this.lastUsedTime) / this.reloadTime;
            this.html.style.backgroundColor = 'white';
        }
        if (ratio > 1) {
            ratio = 1;
        }
        this.html.style.height = (ratio * 100) + "%";
    }
}


export default Ability;