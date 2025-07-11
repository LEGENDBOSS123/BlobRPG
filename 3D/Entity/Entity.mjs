
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
        if (!this.entitySystem || shape.maxParent.id == -1) {
            return;
        }
        if (this.entitySystem.shapeLookup[this.oldShape.maxParent.id] && this.oldShape.maxParent.id == shape.maxParent.id) {
            return;
        }
        if (this.entitySystem.shapeLookup[this.oldShape.maxParent.id]) {
            delete this.entitySystem.shapeLookup[this.oldShape.maxParent.id];
        }
        this.entitySystem.shapeLookup[shape.maxParent.id] = this;
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
}

export default Entity;