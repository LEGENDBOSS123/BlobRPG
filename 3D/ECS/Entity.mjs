export default class Entity {

    static MAX_ID = 1;

    constructor() {
        this.id = this.constructor.MAX_ID++;
        this.components = new Map();
    }

    add(component) {
        this.components.set(component.constructor, component);
        return this;
    }

    get(componentConstructor) {
        return this.components.get(componentConstructor);
    }

    has(componentConstructor) {
        return this.components.has(componentConstructor);
    }

    remove(componentConstructor) {
        return this.components.delete(componentConstructor);
    }
};