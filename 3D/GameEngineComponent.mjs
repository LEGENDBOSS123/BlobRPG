const GameEngineComponent = class {
    constructor(options) {
        this.gameEngine = options?.gameEngine ?? null;
        this.events = {};
    }

    addEventListener(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (!this.events[event]) {
            return;
        }
        var index = this.events[event].indexOf(callback);
        if (index == -1) {
            return;
        }
        this.events[event].splice(index, 1);
        if (this.events[event].length == 0) {
            delete this.events[event];
        }
    }

    dispatchEvent(event, args = []) {
        if (!this.events[event]) {
            return;
        }
        for (var listener in this.events[event]) {
            this.events[event][listener](...args);
        }
    }


    clone(){
        return new this.constructor({
            gameEngine: this.gameEngine
        });
    }

    setGameEngine(gameEngine){
        this.gameEngine = gameEngine;
    }

    toJSON(){
        return {
            gameEngine: this.gameEngine
        };
    }

    static fromJSON(json){
        return new this({
            gameEngine: json.gameEngine
        });
    }

    destroy(){
        this.gameEngine = null;
    }
}

export default GameEngineComponent;