import GameEngineComponent from "../GameEngineComponent.mjs";

const ModelPool = class extends GameEngineComponent {
    constructor(options) {
        super(options);
        this.models = new Map();
    }

    resolvePath(path) {
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('./')) {
            return path;
        }
        return new URL(path, this.assetsDirectory).href;
    }


    async load(url) {
        var path = this.resolvePath(url);
        if(this.models.has(path)) {
            return this.models.get(path).clone();
        }
        var model = await this.gameEngine.graphicsEngine.load(url);
        this.models.set(path, model);
        return model.clone();
    }
}

export default ModelPool;