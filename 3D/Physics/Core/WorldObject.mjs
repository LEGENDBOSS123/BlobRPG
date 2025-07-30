import GameEngineComponent from "../../GameEngineComponent.mjs";
import ClassRegistry from "./ClassRegistry.mjs";

const WorldObject = class extends GameEngineComponent {

    static name = "WORLDOBJECT";

    constructor(options) {
        super(options);
        this.id = options?.id ?? -1;
        this.type = ClassRegistry.getTypeFromName(this.constructor.name);
        this.name = options?.name ?? "";

        
        this.toBeRemoved = options?.toBeRemoved ?? false;
        this.world = options?.world ?? null;
    }

    

    

    
    toJSON() {
        var json = super.toJSON();;
        json.id = this.id;
        json.type = this.type;
        json.name = this.name;
        json.toBeRemoved = this.toBeRemoved;
        return json;
    }

    static fromJSON(json, gameEngine) {
        var worldObject = super.fromJSON(json, gameEngine);
        worldObject.id = json.id;
        worldObject.type = json.type;
        worldObject.name = json.name;
        worldObject.toBeRemoved = json.toBeRemoved;
        worldObject.gameEngine = gameEngine;
        return worldObject;
    }

    updateReferences(gameEngine = this.gameEngine) {
        this.world = gameEngine.world;
        this.gameEngine = gameEngine || this.gameEngine;
    }

    destroy() {
        this.world = null;
        this.id = -1;
        this.toBeRemoved = false;
        this.gameEngine = null;
        this.mesh = null;
        this.events = {};
    }
}


ClassRegistry.register(WorldObject);


export default WorldObject;