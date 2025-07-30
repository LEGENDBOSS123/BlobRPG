import GameEngineComponent from "../GameEngineComponent.mjs";

const WebComponent = class extends GameEngineComponent{
    constructor(options) {
        super(options);
        this.html = null;
        this.DOMevents = {};
    }

    addDOMEventListener(name, target, type, handler, options = false) {
        if(this.DOMevents[name]) {
            return console.warn(`Event listener ${name} already exist`);
        }
        this.DOMevents[name] = {
            name: name,
            target: target,
            type: type,
            handler: handler,
            options: options
        };
        target.addEventListener(type, handler, options);
    }

    removeDOMEventListener(name) {
        var listener = this.DOMevents[name];
        if (listener) {
            listener.target.removeEventListener(listener.type, listener.handler, listener.options);
            delete this.DOMevents[name];
        }
    }

    destroy(){
        for(var name in this.DOMevents) {
            this.removeDOMEventListener(name);
        }
        this.DOMevents = {};
        if(this.html){
            this.html.remove();
        }
        super.destroy();
    }
}


export default WebComponent;