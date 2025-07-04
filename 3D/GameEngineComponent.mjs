const GameEngineComponent = class {
    constructor(options) {
        this.gameEngine = options?.gameEngine ?? null;
    }

    clone(){
        return new this.constructor({
            gameEngine: this.gameEngine
        });
    }

    destroy(){
        this.gameEngine = null;
    }
}

export default GameEngineComponent;