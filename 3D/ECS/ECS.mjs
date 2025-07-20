import Entity from "./Entity.mjs";
import Registry from "./Registry.mjs";

export default class ECS {
    constructor(){
        this.registry = new Registry();
        this.systems = [];
    }

    createEntity(){
        const entity = new Entity();
        this.registry.insert(entity);
        return entity;
    }

    addSystem(systemConstructor){
        const system = new systemConstructor(this);
        this.systems.push(system);
        system.init();
        return system;
    }

    update(dt){
        for(let system of this.systems){
            system.update(dt);
        }
    }

    destroy(){
        for(let system of this.systems){
            system.destroy();
        }
    }
}