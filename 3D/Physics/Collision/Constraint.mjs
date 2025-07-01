import WorldObject from "../Core/WorldObject.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";

const Constraint = class extends WorldObject {

    
    static name = "CONSTRAINT";

    constructor(options) {
        super(options);
        this.ignore = false;
    }

    isValid(){
        return true;
    }

    solve(){
        return null;
    }

    toJSON(){
        var json = super.toJSON();
        json.ignore = this.ignore;
        return json;
    }

    static fromJSON(json, gameEngine){
        var constraint = super.fromJSON(json, gameEngine);
        constraint.ignore = json.ignore;
        return constraint;
    }

    updateReferences(gameEngine){
        super.updateReferences(gameEngine);
    }

    destroy(){
        super.destroy();
    }
}


ClassRegistry.register(Constraint);


export default Constraint;