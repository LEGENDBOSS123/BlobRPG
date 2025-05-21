const ClassRegistry = class {
    static max_id = 0;
    static names = {};
    static types = {};
    static register(obj)
    {
        this.names[obj.name] = this.max_id++;
        this.types[this.names[obj.name]] = obj;
    }

    static getTypeFromName(name){
        return this.names[name];
    }

    static getClassFromName(name){
        return this.getClassFromType(this.getTypeFromName(name));
    }

    static getNameFromType(type){
        this.getClassFromType
    }

    static getClassFromType(type){
        return this.types[type];
    }
}

export default ClassRegistry;