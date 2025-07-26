
import GameEngineComponent from "../GameEngineComponent.mjs";

var Entity = class extends GameEngineComponent {
    constructor(options) {
        super(options);
        this.id = options?.id ?? -1;
        this.entitySystem = options?.entitySystem ?? null;
        this.oldShape = options?.oldShape ?? null;
        this.isEntity = true;
        this.name = options?.name ?? "";
        this.currentAnimation = null;
        this.usesInstancing = options?.usesInstancing ?? false;
        this.gameObjects = [];
    }

    addToGameEngine(gameEngine) {
        for (var i of this.gameObjects) {
            gameEngine.addGameObject(i);
        }
    }

    playAnimation(shape, name, crossFadeDuration = 0, warp = false) {
        if (!shape.mesh || !shape.mesh.animations) {
            return;
        }
        let action = shape.mesh.animations.actions[name];
        if (!action || this.currentAnimation === action) {
            return;
        }
        action.reset().play();
        if (this.currentAnimation) {
            this.currentAnimation.crossFadeTo(action, crossFadeDuration, warp);
        }
        this.currentAnimation = action;
    }

    updateShapeID(shape = this.oldShape) {
        if (!shape) {
            return;
        }
        if (!this.oldShape) {
            this.oldShape = shape;
        }
        if (!this.entitySystem) {
            return;
        }
        if (this.entitySystem.shapeLookup.has(this.oldShape.maxParent) && this.oldShape.maxParent == shape.maxParent) {
            return;
        }
        if (this.entitySystem.shapeLookup.has(this.oldShape.maxParent)) {
            this.entitySystem.shapeLookup.delete(this.oldShape.maxParent);
        }
        this.entitySystem.shapeLookup.set(shape.maxParent, this);
        this.oldShape = shape;
    }

    getMainShape() {
        return this.oldShape;
    }

    fromMesh(mesh, graphicsEngine) {

    }

    updateStep(gameEngine) {

    }

    update(gameEngine) {

    }

    destroy(){
        for(const go of this.gameObjects){
            go.destroy();
        }
        this.entitySystem.remove(this);
        this.entitySystem = null;
        super.destroy();
    }
}

export default Entity;