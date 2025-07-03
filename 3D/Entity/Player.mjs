import Composite from "../Physics/Shapes/Composite.mjs";
import Sphere from "../Physics/Shapes/Sphere.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";
import Entity from "./Entity.mjs";
import Quaternion from "../Physics/Math3D/Quaternion.mjs";
import Box from "../Physics/Shapes/Box.mjs";
import DistanceConstraint from "../Physics/Collision/DistanceConstraint.mjs";
import Slime from "./Slime.mjs";
import TextParticle from "../Graphics/Particle/TextParticle.mjs";
var Player = class extends Entity {
    constructor(options) {
        super(options);
        this.isPlayer = true;
        this.health = options?.health ?? 100;
        this.maxHealth = options?.maxHealth ?? 100;
        this.gravity = options?.gravity ?? new Vector3(0, 0, 0);
        this.moveSpeed = options?.moveSpeed ?? 1;
        this.moveStrength = options?.moveStrength ?? 1;
        this.airMoveStrength = options?.airMoveStrength ?? 0.1;
        this.jumpSpeed = options?.jumpSpeed ?? 1;
        this.size = options?.radius ?? 1;
        this.composite = new Composite({
            global: {
                body: {
                    position: options?.position ?? new Vector3(0, 0, 0),
                    acceleration: this.gravity,
                    angularDamping: 1
                }
            },
            local: {
                body: {
                    mass: 0
                }
            }
        });

        this.tiltable = options?.tiltable ?? true;

        this.totalMass = options?.mass ?? 1;
        this.height = options?.height ?? 3;
        this.spheres = new Array(this.height);
        for (var i = 0; i < this.height; i++) {
            this.spheres[i] = new Sphere({
                radius: this.radius,
                local: {
                    body: {
                        position: new Vector3(0, i * (options?.size ?? 1), 0),
                        mass: this.totalMass / this.height
                    }
                }
            });
            this.composite.add(this.spheres[i]);
            this.spheres[i].collisionMask = this.spheres[i].setBitMask(0, "P", true);

        }


        this.composite.setLocalFlag(Composite.FLAGS.CENTER_OF_MASS, true);
        this.composite.syncAll();
        this.composite.setRestitution(0);
        this.composite.setFriction(0);
        for (const sphere of this.spheres) {
            sphere.setRestitution(0);
            sphere.setFriction(0);
        }

        this.spawnPoint = this.spheres[0].global.body.position.copy();
        this.canJump = false;
        this.touchingGround = false;
        this.groundVelocity = new Vector3();
        this.touchingWall = false;
        this.wallNormal = new Vector3();

        this.groundDetectDot = 0.8;
        this.wallDetectDot = 0.2;

        this.itemHeldBox = new Box({
            width: 0.75,
            height: 8,
            depth: 0.75,
            global: {
                body: {
                    position: options?.position ?? new Vector3(0, 0, 0),
                    acceleration: this.gravity,
                }
            },
            local: {
                body: {
                    mass: 0.0000001
                }
            },
            isSensor: true
        });
        this.itemHeldBox.setLocalFlag(Composite.FLAGS.CENTER_OF_MASS, true);

        this.itemHeldConstraint = new DistanceConstraint({
            body1: this.composite,
            body2: this.itemHeldBox,
            anchor1: new Vector3(0, 2.5, 0),
            anchor2: new Vector3(0, 4, 0),
            restLength: 2
        });

        this.itemHeldPostCollision = function (contact) {
            var other = null;
            var side = 1;
            if (contact.body1 == this.itemHeldBox) {
                other = contact.body2.maxParent;
                side = -1;
            }
            else {
                other = contact.body1.maxParent;
            }
            const otherEntity = this.gameEngine.entitySystem.getEntityFromShape(other);
            if (otherEntity instanceof Slime) {
                const correctNormal = contact.normal.scale(side);
                otherEntity.getMainShape().applyForce(correctNormal.scale(contact.velocity.magnitude() * 0.3), contact.position);
                var damage = 1;
                otherEntity.health -= damage;
                this.gameEngine.particleSystem.addParticle(new TextParticle({
                    position: otherEntity.getMainShape().global.body.position.add(new Vector3(0, 3, 0)),
                    text: "-" + damage,
                    velocity: new Vector3(0, 0.003, 0),
                    duration: 1500,
                    size: 6,
                    fadeInSpeed: 0.1,
                    fadeOutSpeed: 0.1,
                    shrinkSpeed: 0.2,
                    growthSpeed: 0.2,
                    color: "red"
                }));
            }
        }.bind(this);

        this.jumpPostCollision = function (contact) {
            if (contact.ignore) {
                return;
            }
            if (contact.body1.maxParent == this.composite) {
                if (contact.normal.dot(new Vector3(0, 1, 0)) > this.groundDetectDot) {
                    this.canJump = true;
                    if (contact.body2.isImmovable()) {
                        this.touchingGround = true;
                        this.groundVelocity = contact.velocity;
                    }
                }
                if (Math.abs(contact.normal.dot(new Vector3(0, 1, 0))) < this.wallDetectDot) {
                    this.touchingWall = true;
                    this.wallNormal = contact.normal.copy();
                }
            }
            else {
                if (contact.normal.dot(new Vector3(0, -1, 0)) > this.groundDetectDot) {
                    this.canJump = true;
                    if (contact.body1.isImmovable()) {
                        this.touchingGround = true;
                        this.groundVelocity = contact.velocity.scale(-1);
                    }
                }
                if (Math.abs(contact.normal.dot(new Vector3(0, -1, 0))) < this.wallDetectDot) {
                    this.touchingWall = true;
                    this.wallNormal = contact.normal.copy();
                }
            }
        }.bind(this);

        this.postStepCallback = function () {
            var vel = this.composite.global.body.getVelocity();
            var velXZ = new Vector3(vel.x, 0, vel.z);
            var velXZ2 = this.groundVelocity;

            if (velXZ.magnitudeSquared() < 0.0001) {
                return;
            }
            if (this.touchingGround && this.tiltable) {
                velXZ = velXZ2;
            }
            // this.composite.global.body.rotation = Quaternion.lookAt(velXZ.normalize(), new Vector3(0, 1, 0));
        }.bind(this);


        this.preStepCallback = function () {
            if (!this.spheres[0].sleeping) {
                this.touchingGround = false;
                this.touchingWall = false;
            }
        }.bind(this);

        this.spheres[0].addEventListener("collision", this.jumpPostCollision);
        this.spheres[0].addEventListener("preStep", this.preStepCallback);

        this.composite.addEventListener("postStep", this.postStepCallback);

        this.itemHeldBox.addEventListener("collision", this.itemHeldPostCollision);

        this.updateShapeID(this.composite);

        this.keysHeld = {};
        this.justToggled = {};
        this.keysVector = new Vector3();
    }

    setStartPoint(v, override = false) {
        var startPoint = localStorage["playerStartPoint"];
        if (!startPoint || override) {
            localStorage["playerStartPoint"] = JSON.stringify(v.toJSON());
        }
        else {
            v = Vector3.from(JSON.parse(startPoint));
        }

        this.spawnPoint = v.copy();
    }

    setSpawnPoint(v) {
        this.spawnPoint = v.copy();
        localStorage["playerStartPoint"] = JSON.stringify(v.toJSON());
    }

    addToScene(scene) {
        this.composite.addToScene(scene);
        for (const sphere of this.spheres) {
            sphere.addToScene(scene);
        }
    }

    addToWorld(world) {
        world.addComposite(this.composite);
        world.addComposite(this.itemHeldBox);
        world.addConstraint(this.itemHeldConstraint);
        this.updateShapeID();
    }

    setMeshAndAddToScene(options) {
        if (this.composite.mesh) {
            return;
        }
        this.itemHeldBox.setMeshAndAddToScene({}, this.gameEngine);
        this.itemHeldConstraint.setMeshAndAddToScene({
            color: 0xffffff
        }, this.gameEngine);
        // gameEngine.graphicsEngine.load("roblox_default_character.glb").then(function (gltf) {
        //     gltf.scene.scale.set(...(new Vector3(0.4, 0.4, 0.4).scale(this.sphere.radius * 1.95)));
        //     gltf.scene.children[0].quaternion.copy(Quaternion.from(gltf.scene.children[0].quaternion).rotateByAngularVelocity(new Vector3(0, 2, 0)));
        //     for (var e of gltf.scene.children) {
        //         e.position.z -= 6.65;
        //         e.position.x -= 2.805;
        //         e.position.y -= 0.485;
        //     }
        //     gltf.scene.traverse(function (child) {
        //         if (child.isMesh) {
        //             child.castShadow = true;
        //             child.receiveShadow = true;
        //         }
        //     })
        //     var meshData = gameEngine.graphicsEngine.meshLinker.createMeshData(gltf.scene);
        //     this.composite.mesh = meshData;
        //     this.composite.addToScene(gameEngine);
        // }.bind(this));
        // this.sphere.setMeshAndAddToScene({}, gameEngine);
        // this.sphere2.setMeshAndAddToScene({}, gameEngine);
        // this.sphere3.setMeshAndAddToScene({}, gameEngine);
        for (const sphere of this.spheres) {
            sphere.setMeshAndAddToScene({}, gameEngine);
        }
        // this.spheres[this.spheres.length - 1].mesh = this.gameEngine.graphicsEngine.meshLinker.createMeshData(new gameEngine.graphicsEngine.THREE.Mesh());
    }

    wasKeyJustPressed(key) {
        return !!(this.keysHeld[key] && this.justToggled[key]);
    }

    wasKeyJustReleased(key) {
        return !!(!this.keysHeld[key] && this.justToggled[key]);
    }

    isKeyHeld(key) {
        return !!this.keysHeld[key];
    }

    getKeysVector() {
        return this.keysVector.copy();
    }

    updateKeys() {
        this.keysHeld = structuredClone(this.gameEngine.cameraControls.movement);
        this.justToggled = structuredClone(this.gameEngine.cameraControls.justToggled);
        this.keysVector = this.gameEngine.cameraControls.getDelta(this.gameEngine.graphicsEngine.camera).copy();
    }

    updateStep() {
        var vel = this.composite.global.body.getVelocity();
        var velHorizontal = vel.copy();
        velHorizontal.y = 0;

        var vec = this.getKeysVector();
        var vecHorizontal = vec.copy();
        vecHorizontal.y = 0;
        vecHorizontal.normalizeInPlace();


        var desiredVelocity = vecHorizontal.scale(this.moveSpeed);
        if (this.touchingGround) {
            var groundVel = this.groundVelocity.copy();
            groundVel.y = 0;
            desiredVelocity.subtractInPlace(groundVel.subtract(velHorizontal));
        }
        var velDelta = desiredVelocity.subtract(velHorizontal);
        var mag = velDelta.magnitude();

        var moveStrength = this.moveStrength;

        if (!this.touchingGround) {
            moveStrength = this.airMoveStrength;
        }

        if (mag > this.moveSpeed * moveStrength) {
            velDelta.scaleInPlace(this.moveSpeed * moveStrength / mag);
        }
        if (this.isKeyHeld("up") && this.canJump) {
            velDelta.y = this.jumpSpeed;
            this.canJump = false;
        }
        this.composite.global.body.previousPosition.subtractInPlace(velDelta);
    }

    respawn() {
        this.composite.global.body.setPosition(this.spawnPoint.copy());
        this.composite.global.body.setVelocity(new Vector3(0, 0, 0));
        this.composite.global.body.angularVelocity.reset();
        this.composite.global.body.rotation.reset();
        this.composite.global.body.netForce.reset();
        this.composite.global.body.netTorque.reset();
        this.canJump = false;
        this.touchingWall = false;
        this.touchingGround = false;
        this.composite.syncAll();
    }

    toJSON() {
        var json = super.toJSON();
        json.spheres = this.spheres.map(function (sphere) {
            return sphere.id;
        });
        json.composite = this.composite.id;
        json.moveSpeed = this.moveSpeed;
        json.moveStrength = this.moveStrength;
        json.jumpSpeed = this.jumpSpeed;
        json.spawnPoint = this.spawnPoint.toJSON();
        json.canJump = this.canJump;
        json.touchingWall = this.touchingWall;
        json.touchingGround = this.touchingGround
        return json;
    }

    static fromJSON(json, world) {
        var player = super.fromJSON(json, world);
        player.moveSpeed = json.moveSpeed;
        player.moveStrength = json.moveStrength;
        player.jumpSpeed = json.jumpSpeed;
        player.spawnPoint = Vector3.fromJSON(json.spawnPoint);
        player.composite = json.composite;
        player.spheres = json.spheres
        player.canJump = json.canJump;
        player.touchingGround = json.touchingGround;
        player.touchingWall = json.touchingWall;
        return player;
    }

    updateReferences() {
        this.composite = this.gameEngine.world.getByID(this.composite);
        this.sphere = this.spheres.map(function (sphere) {
            return this.gameEngine.world.getByID(sphere);
        });
        this.spheres[0].addEventListener("collision", this.jumpPostCollision);
        this.composite.addEventListener("postStep", this.postStepCallback);
        this.spheres[0].addEventListener("preStep", this.preStepCallback);
    }

    getMainShape() {
        return this.spheres[this.spheres.length - 1];
    }
}

export default Player;