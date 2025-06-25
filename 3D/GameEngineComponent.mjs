const GameEngineComponent = class {
    constructor(options) {
        this.gameEngine = options?.gameEngine ?? null;
    }

    clone(){
        return new this.constructor({
            gameEngine: this.gameEngine
        });
    }
}

export default GameEngineComponent;