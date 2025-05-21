import Vector3 from "./Physics/Math3D/Vector3.mjs";

var CameraTHREEJS = class {
    constructor(options) {

        this.looking = { "xz": 0, "y": 0 };
        this.maxLookY = options?.maxLookY ?? Math.PI / 2;
        this.maxPullback = options?.maxPullback ?? 50;
        this.minPullback = options?.minPullback ?? 0;
        this.pullback = this.setPullback(options?.pullback ?? 0);
        this.currentPullback = this.pullback;
        this.camera = options?.camera;
        this.origin = Vector3.from(options?.origin);
        this.collisionPadding = 0.25;
    }

    rotateX(angle) {
        this.looking.xz += angle;
        return this.looking.xz;
    }

    rotateY(angle) {
        if (this.looking.y + angle > this.maxLookY) {
            angle = this.maxLookY - this.looking.y;
        }
        else if (this.looking.y + angle < -this.maxLookY) {
            angle = -this.maxLookY - this.looking.y;
        }
        else {
            this.looking.y += angle;
        }
        return this.looking.y;
    }

    zoom(delta) {
        if (this.pullback + delta > this.maxPullback) {
            this.pullback = this.maxPullback;
        }
        else if (this.pullback + delta < this.minPullback) {
            this.pullback = this.minPullback;
        }
        else {
            this.pullback += delta;
        }
        return this.pullback;
    }

    setPullback(pullback) {
        this.pullback = pullback;
        if (this.pullback < this.minPullback) {
            this.pullback = this.minPullback;
        }
        if (this.pullback > this.maxPullback) {
            this.pullback = this.maxPullback;
        }
        return this.pullback;
    }

    getLookAt() {
        return new Vector3(Math.cos(this.looking.y) * Math.cos(this.looking.xz), Math.sin(this.looking.y), Math.cos(this.looking.y) * Math.sin(this.looking.xz));
    }

    update(position, graphicsEngine) {

        var normalizedLookAt = this.getLookAt().normalizeInPlace();
        this.camera.lookAt(this.camera.position.clone().add(normalizedLookAt));
        this.origin.set(this.origin.lerp(position, 1));
        this.camera.position.set(...this.origin);
        var addon = new Vector3();
        var raycast = graphicsEngine.raycastFirst({
            direction: normalizedLookAt.scale(-1),
            origin: this.camera.position,
            far: this.currentPullback + 2,
            onlyPhysicsObjects: true
        });
        if (raycast) {
            if(raycast.distance <= this.currentPullback){
                this.currentPullback = raycast.distance;
                var dot = normalizedLookAt.dot(raycast.normal);
                if (Math.abs(dot) < 0.1) {
                    addon = Vector3.from(raycast.normal).scale(this.collisionPadding);
                }
                else{
                    addon = normalizedLookAt.scale(this.collisionPadding/dot);
                }
            }
            
        }
        
        this.camera.position.add(normalizedLookAt.scale(-this.currentPullback).add(addon));
        this.currentPullback = this.pullback;
    }
}



export default CameraTHREEJS;