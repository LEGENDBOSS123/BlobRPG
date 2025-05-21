import HealthEntity from "./HealthEntity.mjs";
import Quaternion from "../Physics/Math3D/Quaternion.mjs";
import Sphere from "../Physics/Shapes/Sphere.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";

var Slime = class extends HealthEntity {
    constructor(options) {
        super(options);
        this.damage = options?.damage ?? 10;
        this.speed = options?.speed ?? 0.3;
        this.fireRate = options?.fireRate ?? 1;
        this.jumpPower = options?.jumpPower ?? 0.1;
        this.maxAmmo = options?.maxAmmo ?? 1;
        this.ammo = options?.ammo ?? this.maxAmmo;
        this.range = options?.range ?? 3;
        this.reloadTime = options?.reloadTime ?? 1;
        this.sphere = new Sphere(options?.sphere);
        this.sphere.radius = options?.radius ?? 1;
        this.maxJumpCooldown = options?.maxJumpCooldown ?? 50;
        this.jumpCooldown = options?.jumpCooldown ?? 0;
        this.sphere.setRestitution(1);
        this.sphere.setFriction(0);
        this.sphere.global.body.linearDamping = new Vector3(0.02, 0, 0.02)
        this.sphere.global.body.angularDamping = 1;
        this.sphere.collisionMask = 0;
        this.sphere.collisionMask = this.sphere.setBitMask(this.sphere.collisionMask, "S", true);
        this.target = null;
        this.sphere.dimensionsChanged();
        this.handleTargetHit = function (target) {
            var world = this.sphere.world;
            var targetEntity = this.entitySystem.getByID(target.followID);
            var targetBody = targetEntity.getMainShape();
            if (!targetBody) {
                this.target = null;
                return;
            }
            var e = targetEntity;
            var damage = Math.floor(Math.random() * 5) + 1
            e.health -= damage;
            top.addParticle(targetBody.global.body.position, damage);
        }.bind(this);
        this.spherePostCollision = function (contact) {
            var targetShapeID = this.entitySystem.getByID(this.target?.followID)?.getMainShape()?.id;
            if (contact.body1.maxParent == this.sphere) {
                if (this.target) {
                    if (contact.body2.maxParent.id == targetShapeID) {
                        this.handleTargetHit(this.target);
                    }
                }
                if (contact.normal.dot(new Vector3(0, 1, 0)) > 0.75) {
                    if (this.jumpCooldown <= 0) {
                        this.jumpCooldown = this.maxJumpCooldown;
                    }
                }
            }
            else {
                if (this.target) {
                    if (contact.body1.maxParent.id == targetShapeID) {
                        this.handleTargetHit(this.target);
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
    }

    addToScene(gameEngine) {
        this.sphere.addToScene(gameEngine);
    }

    addToWorld(world) {
        world.addComposite(this.sphere);
        this.updateShapeID(this.sphere);
    }

    setMeshAndAddToScene(options, gameEngine) {
        gameEngine.graphicsEngine.load("slime.glb", function (gltf) {
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

    findTarget(targets) {
        if (targets.length == 0) {
            return null;
        }
        for (var i of targets) {
            var target = this.entitySystem.getByID(i.followID);
            if (target.health < 0) {
                continue;
            }
            return i;
        }
    }

    update(targets) {
        var target = this.findTarget(targets);
        if (!target) {
            return;
        }
        this.target = target;
        var targetEntity = this.entitySystem.getByID(target.followID);
        var targetBody = targetEntity.getMainShape();
        if (!targetBody) {
            return;
        }
        var direction = targetBody.global.body.position.subtract(this.sphere.global.body.position);

        direction.y = 0;
        if (direction.magnitudeSquared() > 0.001) {
            this.sphere.global.body.rotation = Quaternion.lookAt(direction, new Vector3(0, 1, 0));
        }
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