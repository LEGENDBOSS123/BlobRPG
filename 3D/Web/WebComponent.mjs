import GameEngineComponent from "../GameEngineComponent.mjs";

const WebComponent = class extends GameEngineComponent{
    constructor(options) {
        super(options);
        this.eventListeners = {};
    }

    addEventListener(name, target, type, handler, options = false) {
        if(this.eventListeners[name]) {
            return console.warn(`Event listener ${name} already exist`);
        }
        this.eventListeners[name] = {
            name: name,
            target: target,
            type: type,
            handler: handler,
            options: options
        };
        target.addEventListener(type, handler, options);
    }

    removeEventListener(name) {
        var listener = this.eventListeners[name];
        if (listener) {
            listener.target.removeEventListener(listener.type, listener.handler, listener.options);
            delete this.eventListeners[name];
        }
    }

    destroy(){
        for(var name in this.eventListeners) {
            console.log(name);
            this.removeEventListener(name);
        }
        this.gameEngine = null;
        this.eventListeners = {};
    }
}


export default WebComponent;