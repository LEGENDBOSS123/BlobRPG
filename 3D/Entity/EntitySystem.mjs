import GameEngineComponent from "../GameEngineComponent.mjs";


var EntitySystem = class extends GameEngineComponent{
    constructor(options) {
        super(options);
        this.maxID = 0;
        this.all = {};
        this.shapeLookup = new WeakMap();  
    }


    getByID(id) {
        return this.all[id];
    }

    register(entity) {
        const id = this.maxID++;
        this.all[id] = entity;
        entity.id = id;
        entity.entitySystem = this;
        entity.updateShapeID();
        return id;
    }

    remove(entity) {
        delete this.all[entity.id];
        if(entity.oldShape?.maxParent){
            this.shapeLookup.delete(entity.oldShape.maxParent);
        }
    }

    getEntityFromShape(shape) {
        return this.shapeLookup.get(shape.maxParent);
    }

    updateStep(gameEngine){
        for(const entity in this.all){
            this.all[entity].updateStep(gameEngine);
        }
    }

    update(gameEngine){
        for(const entity in this.all){
            this.all[entity].update(gameEngine);
        }
    }
};

export default EntitySystem;
