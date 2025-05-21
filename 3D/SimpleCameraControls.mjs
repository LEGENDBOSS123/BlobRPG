import Vector3 from "./Physics/Math3D/Vector3.mjs";

const SimpleCameraControls = class {
    constructor(options) {
        this.speed = options?.speed ?? 1;
        this.keybinds = options?.keybinds ?? {};
        this.keysheld = {};
        this.movement = { forward: false, backward: false, left: false, right: false, up: false, down: false, zoomIn: false, zoomOut: false, click: false};
        this.previousMovement = structuredClone(this.movement);
        this.justToggled = structuredClone(this.movement);
        this.camera = options?.camera;
        this.pullbackRate = options?.pullbackRate ?? 0.5;

        this.rotateMethods = {
            drag: options?.rotateMethods?.drag ?? true,
            wheel: options?.rotateMethods?.wheel ?? true,
            shiftLock: options?.rotateMethods?.shiftLock ?? true
        }
        this.rotateSensitivity = {
            drag: options?.rotateSensitivity?.drag ?? 0.1,
            wheel: options?.rotateSensitivity?.wheel ?? 0.1,
            shiftLock: options?.rotateSensitivity?.shiftLock ?? 0.1
        }
        this.shiftLocked = false;
        this.isDragging = false;
        this.shiftLockCursor = options?.shiftLockCursor;

        this.window = options?.window ?? window;
        this.document = options?.document ?? document;
        this.renderDomElement = options?.renderDomElement ?? null;

        if(this.renderDomElement) {
            this.setupEventListeners();
        }

        this.window.addEventListener('keydown', function (e) {
            this.keysheld[e.code] = true;
        }.bind(this));
        this.window.addEventListener('keyup', function (e) {
            this.keysheld[e.code] = false;
        }.bind(this));
        
        this.window.addEventListener('keydown', function (e) {
            if (e.key == "Shift") {
                if (!this.shiftLocked && this.rotateMethods.shiftLock) {
                    this.renderDomElement.requestPointerLock({
                        unadjustedMovement: true,
                    });
                }
                else {
                    this.document.exitPointerLock();
                }
                e.preventDefault();

            }
        }.bind(this));

        this.document.addEventListener("pointerlockchange", function (e) {
            if (this.document.pointerLockElement) {
                this.shiftLocked = true;
                this.shiftLockCursor.style.display = "block";

            } else {
                this.shiftLocked = false;
                this.shiftLockCursor.style.display = "none";
            }
        }.bind(this));
    }

    setupEventListeners() {
        

        this.renderDomElement.addEventListener('mousedown', function (e) {
            this.isDragging = true;
        }.bind(this));

        this.renderDomElement.addEventListener('mouseup', function (e) {
            this.isDragging = false;
        }.bind(this));

        

        this.renderDomElement.addEventListener('wheel', function (e) {
            if (!this.camera || !this.rotateMethods.wheel) {
                return;
            }
            this.camera.rotateY(e.deltaY * this.rotateSensitivity.wheel);
            this.camera.rotateX(-e.deltaX * this.rotateSensitivity.wheel);
        }.bind(this));

        this.renderDomElement.addEventListener('mousemove', function (e) {
            if (!this.camera) {
                return;
            }
            if (this.rotateMethods.drag && this.isDragging) {
                this.camera.rotateX(e.movementX * this.rotateSensitivity.drag);
                this.camera.rotateY(-e.movementY * this.rotateSensitivity.drag);
            }
            else if (this.rotateMethods.shiftLock && this.shiftLocked) {
                this.camera.rotateX(e.movementX * this.rotateSensitivity.shiftLock);
                this.camera.rotateY(-e.movementY * this.rotateSensitivity.shiftLock);
            }
        }.bind(this));

    }

    isHeld(key) {
        return this.keysheld[key] || false;
    }

    addKeyBinds(keybinds) {
        for (const keyCode in keybinds) {
            this.keybinds[keyCode] = keybinds[keyCode];
        }
    }

    addAction(name){
        this.movement[name] = false;
        this.previousMovement[name] = false;
        this.justToggled[name] = false;
    }

    addActions(names){
        for (const name in names) {
            this.addAction(name);
        }
    }

    processAction(action){
        this.movement[action] = true;
        if (this.movement[action] != this.previousMovement[action]) {
            this.justToggled[action] = true;
        }
    }


    reset() {
        for (const move in this.movement) {
            this.justToggled[move] = !this.movement[move] && this.previousMovement[move];
            this.previousMovement[move] = this.movement[move];
            this.movement[move] = false;
        }
    }

    getDelta() {
        var direction = this.camera.camera.getWorldDirection(new this.camera.camera.position.constructor(0, 0, 0));

        direction.y = 0;
        direction = direction.normalize()
        const delta = new Vector3(0, 0, 0);
        if (this.movement.forward) {
            delta.addInPlace(direction);
        }
        if (this.movement.backward) {
            delta.addInPlace(direction.clone().multiplyScalar(-1));
        }
        if (this.movement.left) {
            delta.addInPlace(new Vector3(direction.z, 0, -direction.x));
        }
        if (this.movement.right) {
            delta.addInPlace(new Vector3(-direction.z, 0, direction.x));
        }
        if (this.movement.up) {
            delta.addInPlace(new Vector3(0, 1, 0));
        }
        if (this.movement.down) {
            delta.addInPlace(new Vector3(0, -1, 0));
        }

        delta.normalize();
        delta.scale(this.speed);
        return Vector3.from(delta);
    }

    update(){
        for(const key in this.keybinds){
            if(this.isHeld(key)){
                this.processAction(this.keybinds[key]);
            }
        }
        if(this.isDragging){
            this.processAction("click");
        }

        this.updateZoom();
    }

    updateZoom() {
        if (this.movement.zoomIn) {
            this.camera.zoom(-this.pullbackRate);
            this.movement.zoomIn = false;
        }
        if (this.movement.zoomOut) {
            this.camera.zoom(this.pullbackRate);
            this.movement.zoomOut = false;
        }
    }
};


export default SimpleCameraControls;