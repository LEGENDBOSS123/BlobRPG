import HealthEntity from "./HealthEntity.mjs";
import Quaternion from "../Physics/Math3D/Quaternion.mjs";
import Sphere from "../Physics/Shapes/Sphere.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";
import TextParticle from "../Graphics/Particle/TextParticle.mjs";

var Slime = class extends HealthEntity {
    constructor(options) {
        super(options);
        this.gravity = options?.gravity ?? new Vector3(0, 0, 0);
        this.damage = options?.damage ?? 10;
        this.speed = options?.speed ?? 0.3;
        this.fireRate = options?.fireRate ?? 1;
        this.jumpPower = options?.jumpPower ?? 0.1;
        this.maxAmmo = options?.maxAmmo ?? 1;
        this.ammo = options?.ammo ?? this.maxAmmo;
        this.range = options?.range ?? 3;
        this.reloadTime = options?.reloadTime ?? 1;
        this.maxJumpCooldown = options?.maxJumpCooldown ?? 50;
        this.jumpCooldown = options?.jumpCooldown ?? 0;

        this.sphere = new Sphere(
            {
                global: {
                    body: {
                        position: options?.position ?? new Vector3(0, 0, 0),
                        acceleration: this.gravity,
                        angularDamping: 1
                    }
                }
            }
        );
        this.sphere.radius = options?.radius ?? 1;
        this.sphere.setRestitution(1);
        this.sphere.setFriction(0);
        this.sphere.global.body.linearDamping = new Vector3(0.02, 0, 0.02)
        this.sphere.global.body.angularDamping = 1;
        this.sphere.collisionMask = 0;
        this.sphere.collisionMask = this.sphere.setBitMask(this.sphere.collisionMask, "S", true);
        this.sphere.dimensionsChanged();

        this.targetID = null;

        this.handleTargetHit = function (targetID) {
            var targetEntity = this.gameEngine.entitySystem.getByID(targetID);
            var targetBody = targetEntity.getMainShape();
            if (!targetBody) {
                this.targetID = null;
                return;
            }
            var e = targetEntity;
            var damage = Math.floor(Math.random() * 5) + 1
            e.health -= damage;
            this.gameEngine.particleSystem.addParticle(new TextParticle({
                position: targetBody.global.body.position.add(new Vector3(0, 3, 0)),
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
        }.bind(this);
        this.spherePostCollision = function (contact) {
            if (this.targetID == null) {
                return;
            }
            var targetShapeID = this.gameEngine.entitySystem.getByID(this.targetID)?.getMainShape()?.maxParent.id;
            if (contact.body1.maxParent == this.sphere) {
                if (this.targetID != null) {
                    if (contact.body2.maxParent.id == targetShapeID) {
                        this.handleTargetHit(this.targetID);
                    }
                }
                if (contact.normal.dot(new Vector3(0, 1, 0)) > 0.75) {
                    if (this.jumpCooldown <= 0) {
                        this.jumpCooldown = this.maxJumpCooldown;
                    }
                }
            }
            else {
                if (this.targetID != null) {
                    if (contact.body1.maxParent.id == targetShapeID) {
                        this.handleTargetHit(this.targetID);
                    }
                }
                if (contact.normal.dot(new Vector3(0, -1, 0)) > 0.75) {
                    if (this.jumpCooldown <= 0) {
                        this.jumpCooldown = this.maxJumpCooldown;
                    }
                }
            }
        }.bind(this);
        this.onDelete = function (x) {
            console.log("e", x)
        }.bind(this);
        this.sphere.addEventListener("collision", this.spherePostCollision);
        this.sphere.addEventListener("delete", this.onDelete);
        this.updateShapeID(this.sphere);

        this.getTargets = function () {
            return [];
        }
    }

    addToScene(gameEngine) {
        this.sphere.addToScene(gameEngine);
    }

    addToWorld(world) {
        world.addComposite(this.sphere);
        this.updateShapeID(this.sphere);
    }

    setMeshAndAddToScene(options, gameEngine) {
        gameEngine.graphicsEngine.load("slime.glb").then(function (gltf) {
            gltf.scene.scale.set(this.sphere.radius, this.sphere.radius, this.sphere.radius);
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })
            this.sphere.mesh = gameEngine.graphicsEngine.meshLinker.createMeshData(gltf.scene);
            this.addToScene(gameEngine);
            this.makeHealthSprite(this.sphere.mesh, new Vector3(3, 0.2, 0), new Vector3(0, 2, 0));
        }.bind(this));
    }

    findTarget(targets = []) {
        for (var i of targets) {
            var target = this.gameEngine.entitySystem.getByID(i);
            if (target.health < 0) {
                continue;
            }
            return i;
        }
        return null;
    }

    update() {
        if (this.getMainShape().mesh) {
            this.updateHealthTexture(this.getMainShape().mesh);
        }

        if (this.targetID != null) {
            var targetEntity = this.gameEngine.entitySystem.getByID(this.targetID);

            var targetBody = targetEntity.getMainShape();
            if (targetBody) {
                var direction = targetBody.global.body.position.subtract(this.sphere.global.body.position);

                direction.y = 0;
                if (direction.magnitudeSquared() > 0.001) {
                    this.sphere.global.body.rotation = Quaternion.lookAt(direction, new Vector3(0, 1, 0));
                }
            }

        }
    }

    updateStep() {
        var targetID = this.findTarget(this.getTargets());
        if (targetID == null) {
            return;
        }

        this.targetID = targetID;
        var targetEntity = this.gameEngine.entitySystem.getByID(targetID);

        var targetBody = targetEntity.getMainShape();
        if (!targetBody) {
            return;
        }
        var direction = targetBody.global.body.position.subtract(this.sphere.global.body.position);

        direction.y = 0;
        direction.normalizeInPlace().scaleInPlace(this.speed);
        direction.y = this.jumpPower;



        if (this.jumpCooldown != this.maxJumpCooldown) {
            this.jumpCooldown -= 1;
            return;
        }
        this.sphere.applyForce(direction);
        this.jumpCooldown -= 1;

    }

    toJSON() {
        var json = super.toJSON();
        json.damage = this.damage;
        json.speed = this.speed;
        json.fireRate = this.fireRate;
        json.maxAmmo = this.maxAmmo;
        json.ammo = this.ammo;
        json.range = this.range;
        json.reloadTime = this.reloadTime;
        json.sphere = this.sphere.id;
        json.jumpCooldown = this.jumpCooldown;
        json.maxJumpCooldown = this.maxJumpCooldown;
        json.jumpPower = this.jumpPower;
        return json;
    }

    static fromJSON(json, world) {
        var slime = super.fromJSON(json, world);
        slime.damage = json.damage;
        slime.speed = json.speed;
        slime.fireRate = json.fireRate;
        slime.maxAmmo = json.maxAmmo;
        slime.ammo = json.ammo;
        slime.range = json.range;
        slime.maxJumpCooldown = json.maxJumpCooldown;
        slime.jumpCooldown = json.jumpCooldown;
        slime.reloadTime = json.reloadTime;
        slime.sphere = json.sphere;
        slime.jumpPower = json.jumpPower;
        return slime;
    }

    updateReferences(gameEngine) {
        this.sphere = gameEngine.world.getByID(this.sphere);
        this.sphere.addEventListener("collision", this.spherePostCollision);
        this.sphere.addEventListener("delete", this.onDelete);
    }

    getMainShape() {
        return this.sphere;
    }
}

export default Slime;