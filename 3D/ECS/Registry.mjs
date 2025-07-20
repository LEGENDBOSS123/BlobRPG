export default class Registry {

    constructor() {
        this.entities = [];
    }

    view(...componentConstructors) {
        const entities = [];
        for (const entity of this.entities) {
            let valid = true;
            for (const componentConstructor of componentConstructors) {
                if (!entity.has(componentConstructor)) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                entities.push(entity);
            }
        }
        return entities;
    }

    viewSingle(componentConstructor){
        const entities = [];
        for (const entity of this.entities) {
            if (entity.has(componentConstructor)) {
                entities.push(entity);
            }
        }
        return entities;
    }

    insert(entity) {
        this.entities.push(entity);
    }

    remove(entity) {
        this.entities.splice(this.entities.indexOf(entity), 1);
    }
}